// 全局变量
var tableDataCache = {}; // 缓存每个表的数据
var currentPage = 1; // 当前页码
var pageSize = 10; // 每页显示条数


window.onload = function () {
    var tableTreeDiv = document.getElementById('table-tree');
    try {
        var tableNames = JSON.parse(window.external.GetTableNames());
        if (Object.prototype.toString.call(tableNames) === '[object Array]') {
            // 创建树形结构
            createTreeStructure(tableNames, tableTreeDiv);
        } else {
            alert('加载表列表失败: 返回的数据不是数组' + '\n\n堆栈信息:\n' + error.stack);
        }
    } catch (error) {
        alert('加载表列表失败: ' + error.message + '\n\n堆栈信息:\n' + error.stack);
    }
};

/**
 * 创建树形结构
 * @param {Array} tableNames - 表名数组
 * @param {HTMLElement} parentElement - 父容器元素
 */
function createTreeStructure(tableNames, parentElement) {
    // 添加普通表节点
    for (var i = 0; i < tableNames.length; i++) {
        var tableName = tableNames[i];

        // 创建树节点
        var treeNode = document.createElement('div');
        treeNode.className = 'tree-node tree-node-collapsed'; // 应用类名
        treeNode.textContent = tableName;

        // 绑定点击事件
        treeNode.onclick = (function (node, name) {
            return function () {
                toggleTreeNode(node, name);
            };
        })(treeNode, tableName);

        parentElement.appendChild(treeNode);

        // 创建子内容容器（初始隐藏）
        var contentDiv = document.createElement('div');
        contentDiv.style.display = 'none'; // 初始隐藏
        contentDiv.id = 'view-div-' + tableName;
        contentDiv.className = 'view-div'; // 应用类名
        parentElement.appendChild(contentDiv);
    }

    // 添加 SQL 查询节点
    var sqlTreeNode = document.createElement('div');
    sqlTreeNode.className = 'tree-node tree-node-collapsed'; // 应用类名
    sqlTreeNode.textContent = 'SQL 自定义查询';

    // 绑定点击事件
    sqlTreeNode.onclick = function () {
        toggleTreeNode(sqlTreeNode, '##custom-sql##');
    };

    parentElement.appendChild(sqlTreeNode);

    // 创建 SQL 自定义查询的内容容器（初始隐藏）
    var sqlContentDiv = document.createElement('div');
    sqlContentDiv.style.display = 'none'; // 初始隐藏
    sqlContentDiv.id = 'view-div-custom-sql';
    sqlContentDiv.className = 'view-div'; // 应用类名

    // 创建 SQL 输入框和按钮
    var inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.style.marginBottom = '10px';

    var sqlInput = document.createElement('input');
    sqlInput.type = 'text';
    sqlInput.placeholder = '请输入 SQL 查询语句...';
    sqlInput.id = 'sql-input-custom-sql'; // 唯一 ID
    sqlInput.value = 'select * from video';
    sqlInput.style.width = '80%';
    sqlInput.style.padding = '8px';
    inputGroup.appendChild(sqlInput);

    var sqlButton = document.createElement('button');
    sqlButton.textContent = '执行查询';
    sqlButton.onclick = executeSqlQuery;
    inputGroup.appendChild(sqlButton);

    // 将输入框和按钮添加到内容容器中
    sqlContentDiv.appendChild(inputGroup);

    // 结果展示区域
    var resultContainer = document.createElement('div');
    resultContainer.id = 'query-result-custom-sql';
    sqlContentDiv.appendChild(resultContainer);

    parentElement.appendChild(sqlContentDiv);
}

/**
 * 切换树节点的展开/折叠状态
 * @param {HTMLElement} treeNode - 树节点元素
 * @param {string} tableName - 表名或 '##custom-sql##' 标识
 */
function toggleTreeNode(treeNode, tableName) {
    var contentDiv = document.getElementById('view-div-' + (tableName === '##custom-sql##' ? 'custom-sql' : tableName));

    if (contentDiv.style.display === 'none') {
        // 展开节点
        treeNode.className = 'tree-node tree-node-expanded';
        contentDiv.style.display = 'block';

        if (tableName !== '##custom-sql##') {
            // 如果是普通表节点，加载数据
            if (!tableDataCache[tableName]) {
                loadTableData(tableName);
            } else {
                renderTableData(tableName, currentPage, pageSize);
            }
        }
    } else {
        // 折叠节点
        treeNode.className = 'tree-node tree-node-collapsed';
        contentDiv.style.display = 'none';
    }
}

/**
 * 渲染树节点内容（SQL 自定义查询）
 * @param {string} tableName - 表名或 'custom-sql' 标识
 */
function renderTreeNodeContent(tableName) {
    var container = document.getElementById('table-content-' + tableName);
    container.innerHTML = ''; // 清空容器

    // 创建标题
    var titleElement = document.createElement('h3');
    titleElement.textContent = '▸ SQL 自定义查询';
    container.appendChild(titleElement);

    // 创建输入框
    var inputGroup = document.createElement('div');
    inputGroup.style.marginBottom = '10px';

    var sqlInput = document.createElement('input');
    sqlInput.type = 'text';
    sqlInput.id = 'sql-input-' + tableName; // 为每个表生成唯一的 ID
    sqlInput.placeholder = '请输入 SQL 查询语句...';
    sqlInput.style.width = '80%';
    sqlInput.style.padding = '8px';
    inputGroup.appendChild(sqlInput);

    // 创建执行按钮
    var executeButton = document.createElement('button');
    executeButton.textContent = '执行查询';
    executeButton.style.marginLeft = '10px';
    executeButton.onclick = function () {
        var query = sqlInput.value.trim(); // 获取用户输入的 SQL 查询语句
        if (!query) {
            alert('请输入有效的 SQL 查询语句！' + '\n\n堆栈信息:\n' + error.stack);
            return;
        }
        executeSQLQuery(tableName, query);
    };
    inputGroup.appendChild(executeButton);

    container.appendChild(inputGroup);

    // 结果展示区域
    var resultContainer = document.createElement('div');
    resultContainer.id = 'query-result-' + tableName;
    container.appendChild(resultContainer);
}

function loadTableData(tableName) {
    showLoading();
    try {
        var sqlQuery = "SELECT * FROM " + tableName;
        var res = JSON.parse(window.external.LoadTableData(sqlQuery, false));
        if (res.status && Array.isArray(res.data)) {
            tableDataCache[tableName] = res.data;
            renderTableData(tableName, currentPage, pageSize);
        } else {
            alert('加载数据失败: ' + (res.message || '返回的数据不是数组') + '\n\n堆栈信息:\n' + error.stack);
        }
    } catch (error) {
        alert('加载数据时发生错误: ' + error.message + '\n\n堆栈信息:\n' + error.stack);
    } finally {
        hideLoading();
    }
}

/**
 * 执行 SQL 查询
 */
function executeSqlQuery() {
    var sqlInput = document.getElementById('sql-input-custom-sql');
    var sqlQuery = sqlInput.value.trim();

    if (!sqlQuery) {
        alert('请输入有效的 SQL 查询语句！');
        return;
    }

    showLoading();
    try {
        var res = JSON.parse(window.external.LoadTableData(sqlQuery, false));
        if (res.status && Array.isArray(res.data)) {
            tableDataCache['##custom-sql##'] = res.data;
            renderTableData('##custom-sql##', currentPage, pageSize); // 渲染到树节点内容容器
        } else {
            alert('执行查询失败: ' + (res.message || '返回的数据不是数组'));
        }
    } catch (error) {
        alert('执行查询时发生错误: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * 渲染查询结果
 * @param {string} tableName - 表名或 'custom-sql' 标识
 * @param {Array} data - 查询结果数据
 */
function renderQueryResult(tableName, data) {
    var resultContainer = document.getElementById('query-result-' + tableName);
    resultContainer.innerHTML = '';

    if (data.length === 0) {
        resultContainer.textContent = '暂无数据';
        return;
    }

    // 创建表格容器
    var table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // 创建表头
    var html = '<thead><tr>';
    var columns = Object.keys(data[0]);
    for (var i = 0; i < columns.length; i++) {
        html += '<th>' + columns[i] + '</th>';
    }
    html += '</tr></thead>';

    // 创建表格主体
    html += '<tbody>';
    for (var j = 0; j < data.length; j++) {
        html += '<tr>';
        for (var k = 0; k < columns.length; k++) {
            var cellContent = data[j][columns[k]] || '(空)';
            html += '<td title="' + cellContent + '">' + truncateText(cellContent) + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody>';

    table.innerHTML = html;
    resultContainer.appendChild(table);
}

/**
 * 渲染表格数据
 * @param {string} tableName - 表名或 '##custom-sql##' 标识
 * @param {number} page - 当前页码
 * @param {number} size - 每页显示条数
 */
function renderTableData(tableName, page, size) {
    var data = tableDataCache[tableName];
    var targetDiv = document.getElementById('view-div-' + (tableName === '##custom-sql##' ? 'custom-sql' : tableName));

    // 如果数据为空，显示提示信息
    if (!Array.isArray(data) || data.length === 0) {
        targetDiv.innerHTML = '<p>暂无数据</p>';
        return;
    }

    var start = (page - 1) * size;
    var end = Math.min(start + size, data.length);
    var paginatedData = data.slice(start, end);

    // 创建表格容器
    var tableContainer = document.createElement('div');
    tableContainer.className = 'table-container'; // 应用表格容器样式

    // 创建表格元素
    var table = document.createElement('table');

    // 创建表头
    var html = '<thead><tr>';
    var columns = Object.keys(data[0]);
    for (var i = 0; i < columns.length; i++) {
        html += '<th>' + columns[i] + '</th>';
    }
    html += '</tr></thead>';

    // 创建表格主体
    html += '<tbody>';
    for (var j = 0; j < paginatedData.length; j++) {
        html += '<tr>';
        for (var k = 0; k < columns.length; k++) {
            var cellContent = paginatedData[j][columns[k]] || '(空)';
            html += '<td title="' + cellContent + '">' + truncateText(cellContent) + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody>';

    table.innerHTML = html;

    // 将表格添加到容器中
    tableContainer.appendChild(table);

    // 清空目标容器并插入新的内容
    targetDiv.innerHTML = '';

    // 添加上方分页控件
    targetDiv.appendChild(renderPagination(tableName, data.length, page, size));

    // 插入表格
    targetDiv.appendChild(tableContainer);

    // 添加下方分页控件
    targetDiv.appendChild(renderPagination(tableName, data.length, page, size));
}

/**
 * 渲染分页控件
 * @param {string} tableName - 表名或 'custom-sql' 标识
 * @param {number} totalItems - 数据总条数
 * @param {number} currentPage - 当前页码
 * @param {number} pageSize - 每页显示条数
 * @returns {HTMLElement} - 分页控件元素
 */
function renderPagination(tableName, totalItems, currentPage, pageSize) {
    var totalPages = Math.ceil(totalItems / pageSize);
    var paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';

    // 如果没有数据，直接返回一个提示信息
    if (totalItems === 0 || totalPages === 0) {
        paginationDiv.textContent = '暂无数据';
        return paginationDiv;
    }

    // 上一页按钮
    var prevButton = document.createElement('button');
    prevButton.textContent = '上一页';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = function () {
        if (currentPage > 1) {
            renderTableData(tableName, currentPage - 1, pageSize);
        }
    };
    paginationDiv.appendChild(prevButton);

    // 显示页码范围
    var range = 2; // 当前页前后显示的页码数量
    var startPage = Math.max(1, currentPage - range);
    var endPage = Math.min(totalPages, currentPage + range);

    // 如果起始页不是第一页，则显示第一页和省略号
    if (startPage > 1) {
        addPageButton(paginationDiv, tableName, pageSize, 1);
        if (startPage > 2) {
            paginationDiv.appendChild(document.createTextNode('...'));
        }
    }

    // 显示当前页及其前后几页
    for (var i = startPage; i <= endPage; i++) {
        addPageButton(paginationDiv, tableName, pageSize, i, i === currentPage);
    }

    // 如果结束页不是最后一页，则显示省略号和最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationDiv.appendChild(document.createTextNode('...'));
        }
        addPageButton(paginationDiv, tableName, pageSize, totalPages);
    }

    // 下一页按钮
    var nextButton = document.createElement('button');
    nextButton.textContent = '下一页';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = function () {
        if (currentPage < totalPages) {
            renderTableData(tableName, currentPage + 1, pageSize);
        }
    };
    paginationDiv.appendChild(nextButton);

    // 添加当前页信息
    var pageInfo = document.createElement('span');
    pageInfo.textContent = '当前第 ' + currentPage + ' 页，共 ' + totalPages + ' 页';
    paginationDiv.appendChild(pageInfo); // 将页信息放在最后

    return paginationDiv;
}

/**
 * 添加页码按钮
 * @param {HTMLElement} paginationDiv - 分页控件容器
 * @param {string} tableName - 表名或 'custom-sql' 标识
 * @param {number} pageSize - 每页显示条数
 * @param {number} pageNumber - 页码
 * @param {boolean} isActive - 是否为当前页
 */
function addPageButton(paginationDiv, tableName, pageSize, pageNumber, isActive) {
    var pageButton = document.createElement('button');
    pageButton.textContent = pageNumber;
    if (isActive) {
        pageButton.classList.add('active'); // 应用 active 类
    }
    pageButton.onclick = function () {
        if (!isActive) {
            renderTableData(tableName, pageNumber, pageSize);
        }
    };
    paginationDiv.appendChild(pageButton);
}

/**
 * 分页按钮点击事件
 * @param {string} tableName - 表名
 * @param {number} newPage - 新页码
 * @param {number} pageSize - 每页显示条数
 */
function changePage(tableName, newPage, pageSize) {
    var totalPages = Math.ceil(tableDataCache[tableName].length / pageSize);
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    renderTableData(tableName, currentPage, pageSize);
}

/**
 * 修改每页显示条数
 * @param {string} tableName - 表名
 * @param {number} newSize - 新的每页显示条数
 */
function changePageSize(tableName, newSize) {
    pageSize = parseInt(newSize, 10);
    currentPage = 1;
    renderTableData(tableName, currentPage, pageSize);
}

/**
 * 截断文本以适应单元格宽度
 * @param {string} text - 原始文本
 * @returns {string} - 截断后的文本
 */
function truncateText(text) {
    // 确保 text 是字符串
    if (typeof text !== 'string') {
        console.warn('truncateText: 参数不是字符串，尝试转换为字符串:', text);
        text = String(text); // 将非字符串转换为字符串
    }

    if (text.length > 30) {
        return text.slice(0, 30) + '...';
    }
    return text;
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}