"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoFooter = TodoFooter;
var classnames_1 = require("classnames");
var React = require("react");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function TodoFooter(_a) {
    var completedCount = _a.completedCount, onClearCompleted = _a.onClearCompleted, nowShowing = _a.nowShowing, count = _a.count;
    var activeTodoWord = utils_1.Utils.pluralize(count, 'item');
    var clearButton = null;
    if (completedCount > 0) {
        clearButton = (React.createElement("button", { className: "clear-completed", onClick: onClearCompleted }, "Clear completed"));
    }
    return (React.createElement("footer", { className: "footer" },
        React.createElement("span", { className: "todo-count" },
            React.createElement("strong", null, count),
            " ",
            activeTodoWord,
            " left"),
        React.createElement("ul", { className: "filters" },
            React.createElement("li", null,
                React.createElement("a", { href: "#/", className: (0, classnames_1.default)({ selected: nowShowing === constants_1.ALL_TODOS }) }, "All")),
            ' ',
            React.createElement("li", null,
                React.createElement("a", { href: "#/active", className: (0, classnames_1.default)({ selected: nowShowing === constants_1.ACTIVE_TODOS }) }, "Active")),
            ' ',
            React.createElement("li", null,
                React.createElement("a", { href: "#/completed", className: (0, classnames_1.default)({ selected: nowShowing === constants_1.COMPLETED_TODOS }) }, "Completed"))),
        clearButton));
}
