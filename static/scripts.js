var customKey = '##custom-sql##';
var tabIdCounter = 0;

try {
    var app = new Vue({
        el: '#app',
        data: {
            // Global state
            isLoading: false,
            loadingMessage: '',
            
            // Table data
            tableNames: [],
            tableInfoCache: {},
            sidebarSearchQuery: '',
            
            // Tab system
            activeTabs: [],
            currentTabId: null,
            
            // Default SQL for new custom queries
            defaultSqlTemplate: 'SELECT * FROM table_name LIMIT 10'
        },
        computed: {
            filteredTableNames: function() {
                if (!this.sidebarSearchQuery) {
                    return this.tableNames;
                }
                return this.tableNames.filter(tableName => 
                    tableName.toLowerCase().includes(this.sidebarSearchQuery.toLowerCase())
                );
            },
            
            currentTab: function() {
                return this.activeTabs.find(tab => tab.id === this.currentTabId);
            }
        },
        mounted: async function () {
            this.showLoading('正在加载数据库表列表...');
            try {
                var tableNames = JSON.parse(await chrome.webview.hostObjects.external.GetTableNames());
                if (Array.isArray(tableNames)) {
                    this.tableNames = tableNames;
                    this.defaultSqlTemplate = 'SELECT * FROM ' + (tableNames[0] || 'table_name') + ' LIMIT 10';
                    
                    // Pre-load table info for sidebar display
                    await this.preloadTableInfo();
                } else {
                    this.showError('加载表列表失败: 返回的数据不是数组');
                }
            } catch (error) {
                this.showError('加载表列表失败: ' + error.message);
                console.error('Error details:', error);
            } finally {
                this.hideLoading();
            }
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', this.handleKeydown);
        },
        
        beforeDestroy: function() {
            document.removeEventListener('keydown', this.handleKeydown);
        },
        
        methods: {
            // Loading states
            showLoading: function(message) {
                this.isLoading = true;
                this.loadingMessage = message || '加载中...';
            },
            
            hideLoading: function() {
                this.isLoading = false;
                this.loadingMessage = '';
            },
            
            showError: function(message) {
                console.error(message);
                alert('错误: ' + message);
            },
            
            // Table info management
            preloadTableInfo: async function() {
                // Load basic info for all tables to show in sidebar
                for (let tableName of this.tableNames) {
                    try {
                        if (!this.tableInfoCache[tableName]) {
                            var tableInfoResult = await chrome.webview.hostObjects.external.GetTableInfo(tableName);
                            var tableInfo = JSON.parse(tableInfoResult);
                            if (tableInfo.status) {
                                this.tableInfoCache[tableName] = {
                                    estimatedRowCount: tableInfo.estimatedRowCount,
                                    columns: tableInfo.columns
                                };
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to load info for table ' + tableName, error);
                    }
                }
            },
            
            getTableInfo: function(tableName) {
                return this.tableInfoCache[tableName];
            },
            
            formatRowCount: function(count) {
                if (count < 1000) return count.toString();
                if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
                return (count / 1000000).toFixed(1) + 'M';
            },
            
            // Tab management
            generateTabId: function() {
                return ++tabIdCounter;
            },
            
            openTableTab: function(tableName, force = false) {
                // Check if tab already exists
                var existingTab = this.activeTabs.find(tab => 
                    tab.type === 'table' && tab.tableName === tableName
                );
                
                if (existingTab && !force) {
                    this.switchTab(existingTab.id);
                    return;
                }
                
                // Create new tab
                var tabId = this.generateTabId();
                var newTab = {
                    id: tabId,
                    type: 'table',
                    title: tableName,
                    tableName: tableName,
                    
                    // Table state
                    data: null,
                    columns: [],
                    total: 0,
                    currentPage: 1,
                    pageSize: 100,
                    isLoading: false
                };
                
                this.activeTabs.push(newTab);
                this.switchTab(tabId);
                
                // Load table data
                this.loadTableTabData(tabId);
            },
            
            openCustomSqlTab: function() {
                var tabId = this.generateTabId();
                var customTabCount = this.activeTabs.filter(tab => tab.type === 'custom').length;
                var tabTitle = 'SQL查询' + (customTabCount > 0 ? ' (' + (customTabCount + 1) + ')' : '');
                
                var newTab = {
                    id: tabId,
                    type: 'custom',
                    title: tabTitle,
                    
                    // SQL state
                    sqlQuery: this.defaultSqlTemplate,
                    data: null,
                    columns: [],
                    isLoading: false
                };
                
                this.activeTabs.push(newTab);
                this.switchTab(tabId);
            },
            
            switchTab: function(tabId) {
                this.currentTabId = tabId;
            },
            
            closeTab: function(tabId) {
                var tabIndex = this.activeTabs.findIndex(tab => tab.id === tabId);
                if (tabIndex === -1) return;
                
                this.activeTabs.splice(tabIndex, 1);
                
                // Switch to another tab if current tab was closed
                if (this.currentTabId === tabId) {
                    if (this.activeTabs.length > 0) {
                        // Switch to the adjacent tab or the last tab
                        var newIndex = Math.min(tabIndex, this.activeTabs.length - 1);
                        this.switchTab(this.activeTabs[newIndex].id);
                    } else {
                        this.currentTabId = null;
                    }
                }
            },
            
            hasActiveTab: function(tableName) {
                return this.activeTabs.some(tab => 
                    tab.type === 'table' && tab.tableName === tableName
                );
            },
            
            // Table tab operations
            loadTableTabData: async function(tabId, page = 1) {
                var tab = this.activeTabs.find(t => t.id === tabId);
                if (!tab || tab.type !== 'table') return;
                
                tab.isLoading = true;
                
                try {
                    // Load table info if not cached
                    if (!this.tableInfoCache[tab.tableName]) {
                        var tableInfoResult = await chrome.webview.hostObjects.external.GetTableInfo(tab.tableName);
                        var tableInfo = JSON.parse(tableInfoResult);
                        if (tableInfo.status) {
                            this.tableInfoCache[tab.tableName] = {
                                estimatedRowCount: tableInfo.estimatedRowCount,
                                columns: tableInfo.columns
                            };
                        }
                    }
                    
                    var cachedInfo = this.tableInfoCache[tab.tableName];
                    if (cachedInfo) {
                        tab.total = cachedInfo.estimatedRowCount;
                        tab.columns = cachedInfo.columns.map(col => col.name);
                    }
                    
                    // Load page data
                    tab.currentPage = page;
                    var offset = (page - 1) * tab.pageSize;
                    var sqlQuery = `SELECT * FROM \`${tab.tableName}\` LIMIT ${tab.pageSize} OFFSET ${offset}`;
                    
                    var data = await this.getTableData(sqlQuery);
                    tab.data = data;
                    
                    if (data && data.length > 0 && tab.columns.length === 0) {
                        tab.columns = Object.keys(data[0]);
                    }
                    
                } catch (error) {
                    this.showError('加载表数据失败: ' + error.message);
                } finally {
                    tab.isLoading = false;
                }
            },
            
            navigateToPage: async function(tabId, page) {
                if (typeof page === 'string' && page === '...') {
                    return; // Ignore ellipsis clicks
                }
                await this.loadTableTabData(tabId, page);
            },
            
            changeTabPageSize: async function(tabId, newPageSize) {
                var tab = this.activeTabs.find(t => t.id === tabId);
                if (!tab) return;
                
                tab.pageSize = newPageSize;
                tab.currentPage = 1; // Reset to first page
                await this.loadTableTabData(tabId, 1);
            },
            
            refreshTable: async function(tabId) {
                var tab = this.activeTabs.find(t => t.id === tabId);
                if (!tab || tab.type !== 'table') return;
                
                // Clear cache for this table
                delete this.tableInfoCache[tab.tableName];
                
                // Reload data
                await this.loadTableTabData(tabId, tab.currentPage);
            },
            
            exportTable: function(tabId) {
                // TODO: Implement table export functionality
                alert('导出功能正在开发中...');
            },
            
            // Custom SQL operations
            executeCustomQuery: async function(tabId) {
                var tab = this.activeTabs.find(t => t.id === tabId);
                if (!tab || tab.type !== 'custom') return;
                
                if (!tab.sqlQuery || !tab.sqlQuery.trim()) {
                    this.showError('请输入 SQL 查询语句');
                    return;
                }
                
                tab.isLoading = true;
                
                try {
                    var data = await this.getTableData(tab.sqlQuery);
                    tab.data = data;
                    
                    if (data && data.length > 0) {
                        tab.columns = Object.keys(data[0]);
                    } else {
                        tab.columns = [];
                    }
                } catch (error) {
                    this.showError('SQL 查询失败: ' + error.message);
                    tab.data = null;
                    tab.columns = [];
                } finally {
                    tab.isLoading = false;
                }
            },
            
            clearCustomQuery: function(tabId) {
                var tab = this.activeTabs.find(t => t.id === tabId);
                if (!tab || tab.type !== 'custom') return;
                
                tab.sqlQuery = this.defaultSqlTemplate;
                tab.data = null;
                tab.columns = [];
            },
            
            // Data loading
            getTableData: async function (sqlQuery) {
                try {
                    var res = JSON.parse(await chrome.webview.hostObjects.external.LoadTableData(sqlQuery, false));
                    if (res.status && Array.isArray(res.data)) {
                        return res.data;
                    } else {
                        throw new Error(res.message || '返回的数据不是数组');
                    }
                } catch (error) {
                    console.error('加载数据时发生错误:', error);
                    throw error;
                }
            },
            
            // Pagination helpers
            visiblePages: function(tab) {
                if (!tab || tab.total === 0) return [];
                
                var currentPage = tab.currentPage;
                var totalPages = Math.ceil(tab.total / tab.pageSize);
                var pages = [];
                
                if (totalPages <= 7) {
                    for (var i = 1; i <= totalPages; i++) {
                        pages.push(i);
                    }
                } else {
                    if (currentPage <= 4) {
                        pages = [1, 2, 3, 4, 5, '...', totalPages];
                    } else if (currentPage >= totalPages - 3) {
                        pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                    } else {
                        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                    }
                }
                
                return pages;
            },
            
            // Keyboard shortcuts
            handleKeydown: function(event) {
                // Prevent spacebar from triggering QuickLook exit
                // This is crucial to prevent the plugin from being closed when user presses space
                if (event.key === ' ' || event.code === 'Space') {
                    // Check if we're not in a text input/textarea where space should work normally
                    var activeElement = document.activeElement;
                    var isInTextInput = activeElement && (
                        activeElement.tagName.toLowerCase() === 'input' || 
                        activeElement.tagName.toLowerCase() === 'textarea' ||
                        activeElement.isContentEditable
                    );
                    
                    if (!isInTextInput) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        return false;
                    }
                }
                
                // Ctrl/Cmd + F: Focus sidebar search
                if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                    event.preventDefault();
                    var searchInput = document.querySelector('.sidebar-search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
                
                // Escape: Clear sidebar search
                if (event.key === 'Escape') {
                    if (this.sidebarSearchQuery) {
                        this.sidebarSearchQuery = '';
                    }
                }
                
                // Ctrl/Cmd + T: New custom SQL tab
                if ((event.ctrlKey || event.metaKey) && event.key === 't') {
                    event.preventDefault();
                    this.openCustomSqlTab();
                }
                
                // Ctrl/Cmd + W: Close current tab
                if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
                    event.preventDefault();
                    if (this.currentTabId) {
                        this.closeTab(this.currentTabId);
                    }
                }
                
                // Ctrl/Cmd + [1-9]: Switch to tab by number
                if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
                    event.preventDefault();
                    var tabIndex = parseInt(event.key) - 1;
                    if (tabIndex < this.activeTabs.length) {
                        this.switchTab(this.activeTabs[tabIndex].id);
                    }
                }
            }
        }
    });
} catch (error) {
    console.error('Vue 应用初始化失败:', error);
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif;"><h2>应用加载失败</h2><p>错误信息: ' + error.message + '</p><p>请刷新页面重试。</p></div>';
}
