var customKey = '##custom-sql##';

try {
    var app = new Vue({
        el: '#app',
        data: {
            currentNodeName: '',
            treeNodes: [],
            sqlInput: 'SELECT * FROM xxxxx LIMIT 10',
            isLoading: false,
            loadingMessage: '',
            searchQuery: '',
        },
        computed: {
            filteredTreeNodes: function() {
                if (!this.searchQuery) {
                    return this.treeNodes;
                }
                return this.treeNodes.filter(node => 
                    node.label.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
        },
        mounted: async function () {
            this.showLoading('正在加载数据库表列表...');
            that = this;
            try {
                var tableNames = JSON.parse(await chrome.webview.hostObjects.external.GetTableNames());
                if (Object.prototype.toString.call(tableNames) === '[object Array]') {
                    var treeNodes = tableNames.map(function (tableName) {
                        return that.genNodeInfo(false, tableName, tableName);
                    });
                    treeNodes.push(that.genNodeInfo(true, customKey, 'SQL 自定义查询'));
                    that.treeNodes = treeNodes;
                    that.sqlInput = 'SELECT * FROM ' + (tableNames[0] || 'table_name') + ' LIMIT 10';
                } else {
                    that.showError('加载表列表失败: 返回的数据不是数组');
                }
            } catch (error) {
                that.showError('加载表列表失败: ' + error.message);
                console.error('Error details:', error);
            } finally {
                this.hideLoading();
            }
        },
        methods: {
            genNodeInfo: function (isCustom, tableName, label) {
                return {
                    isCustom: isCustom,
                    name: tableName,
                    label: label,
                    expanded: isCustom,
                    data: undefined,
                    columns: [],
                    total: 0,
                    currentPage: 1,
                    pageSize: 20, // Increased default page size
                    isLoading: false,
                    lastQuery: null,
                };
            },
            
            showLoading: function(message) {
                this.isLoading = true;
                this.loadingMessage = message || '加载中...';
            },
            
            hideLoading: function() {
                this.isLoading = false;
                this.loadingMessage = '';
            },
            
            showError: function(message) {
                // Modern error display - could be enhanced with a toast component
                alert('错误: ' + message);
                console.error('Application error:', message);
            },

            /**
             * 切换树节点的展开/折叠状态
             * @param {Object} treeNode - 树节点对象
             * @param {number} index - 节点索引
             */
            toggleNode: async function (treeNode, index) {
                var that = this;
                that.currentNodeName = treeNode['name'];
                treeNode['expanded'] = !treeNode['expanded'];

                if (treeNode.isCustom) {
                    return;
                }
                
                if (index < 0 || index >= this.treeNodes.length) {
                    that.showError('无效的索引: ' + index);
                    return;
                }
                
                if (treeNode.data === undefined && treeNode.expanded) {
                    await that.loadTableInfo(treeNode, index);
                }
            },
            
            loadTableInfo: async function(treeNode, index) {
                treeNode.isLoading = true;
                try {
                    // Use the new GetTableInfo method for better performance
                    var tableInfoResult = await chrome.webview.hostObjects.external.GetTableInfo(treeNode.name);
                    var tableInfo = JSON.parse(tableInfoResult);
                    
                    if (tableInfo.status) {
                        treeNode.total = tableInfo.estimatedRowCount;
                        treeNode.columns = tableInfo.columns.map(col => col.name);
                        treeNode.columnInfo = tableInfo.columns; // Store full column info
                        
                        // Load first page of data
                        await this.loadTableData(treeNode, index, 1);
                    } else {
                        this.showError('获取表信息失败: ' + tableInfo.message);
                    }
                } catch (error) {
                    this.showError('获取表信息失败: ' + error.message);
                } finally {
                    treeNode.isLoading = false;
                }
            },
            
            loadTableData: async function(treeNode, index, page) {
                if (!page) page = treeNode.currentPage;
                treeNode.currentPage = page;
                
                var offset = (page - 1) * treeNode.pageSize;
                var sqlQuery = `SELECT * FROM \`${treeNode.name}\` LIMIT ${treeNode.pageSize} OFFSET ${offset}`;
                
                await this.renderTableData(sqlQuery, index);
            },

            reloadTableData: async function (treeNode, index) {
                await this.loadTableInfo(treeNode, index);
            },
            renderTableData: async function (sqlQuery, index) {
                if (index < 0 || index >= this.treeNodes.length) {
                    this.showError('无效的索引: ' + index);
                    return;
                }
                
                var node = this.treeNodes[index];
                node.isLoading = true;
                
                try {
                    var data = await this.getTableData(sqlQuery);
                    var columns = [];
                    if (data && data.length > 0) {
                        columns = Object.keys(data[0]);
                    }
                    
                    Vue.set(this.treeNodes[index], "data", data);
                    Vue.set(this.treeNodes[index], "columns", columns);
                    Vue.set(this.treeNodes[index], "lastQuery", sqlQuery);
                } catch (error) {
                    this.showError('渲染表数据失败: ' + error.message);
                } finally {
                    node.isLoading = false;
                }
            },
            
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

            renderPage: async function (treeNode, index, page) {
                if (typeof page === 'string' && page === '...') {
                    return; // Ignore ellipsis clicks
                }
                
                await this.loadTableData(treeNode, index, page);
            },
            
            changePageSize: async function (treeNode, index, pageSize) {
                treeNode.currentPage = 1;
                treeNode.pageSize = parseInt(pageSize);
                await this.loadTableData(treeNode, index, 1);
            },

            // Enhanced search functionality
            clearSearch: function() {
                this.searchQuery = '';
            },
            
            // Execute custom SQL query with better error handling
            executeCustomQuery: async function(index) {
                var sqlQuery = this.sqlInput.trim();
                if (!sqlQuery) {
                    this.showError('请输入SQL查询语句');
                    return;
                }
                
                this.showLoading('执行查询中...');
                try {
                    await this.renderTableData(sqlQuery, index);
                } catch (error) {
                    this.showError('查询执行失败: ' + error.message);
                } finally {
                    this.hideLoading();
                }
            },

            /**
            * 计算需要显示的页码范围 - Enhanced for better UX
            * @param {Object} node - 分页数据对象
            * @returns {Array} - 包含页码或省略号的数组
            */
            visiblePages: function (node) {
                const totalPages = Math.ceil(node.total / node.pageSize);
                const currentPage = node.currentPage;
                const range = [];

                if (totalPages <= 7) {
                    // If total pages is small, show all
                    for (let i = 1; i <= totalPages; i++) {
                        range.push(i);
                    }
                } else {
                    // Always show first page
                    range.push(1);
                    
                    let start = Math.max(2, currentPage - 2);
                    let end = Math.min(totalPages - 1, currentPage + 2);
                    
                    // Add ellipsis if there's a gap
                    if (start > 2) {
                        range.push('...');
                    }
                    
                    // Add middle pages
                    for (let i = start; i <= end; i++) {
                        range.push(i);
                    }
                    
                    // Add ellipsis if there's a gap before last page
                    if (end < totalPages - 1) {
                        range.push('...');
                    }
                    
                    // Always show last page (if more than 1 page)
                    if (totalPages > 1) {
                        range.push(totalPages);
                    }
                }

                return range;
            },

            // Utility methods kept for compatibility
            showLoading: function () {
                // document.getElementById('loading').style.display = 'block';
                console.log('Loading...');
            },
            hideLoading: function () {
                // document.getElementById('loading').style.display = 'none';
                console.log('Loading complete');
            }
        },
    });
}
catch (error) {
    alert('加载表列表失败: ' + error.message + '\n\n堆栈信息:\n' + error.stack);
}
