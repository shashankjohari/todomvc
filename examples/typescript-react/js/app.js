"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_1 = require("react");
var client_1 = require("react-dom/client");
var todoModel_1 = require("./todoModel");
var footer_1 = require("./footer");
var todoItem_1 = require("./todoItem");
var constants_1 = require("./constants");
function TodoApp(_a) {
    var model = _a.model;
    var _b = (0, react_1.useState)(constants_1.ALL_TODOS), nowShowing = _b[0], setNowShowing = _b[1];
    var _c = (0, react_1.useState)(null), editing = _c[0], setEditing = _c[1];
    var newFieldRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var router = Router({
            '/': function () { return setNowShowing(constants_1.ALL_TODOS); },
            '/active': function () { return setNowShowing(constants_1.ACTIVE_TODOS); },
            '/completed': function () { return setNowShowing(constants_1.COMPLETED_TODOS); }
        });
        router.init('/');
    }, []);
    function handleNewTodoKeyDown(event) {
        if (event.keyCode !== constants_1.ENTER_KEY) {
            return;
        }
        event.preventDefault();
        var val = newFieldRef.current.value.trim();
        if (val) {
            model.addTodo(val);
            newFieldRef.current.value = '';
        }
    }
    function toggleAll(event) {
        var target = event.target;
        var checked = target.checked;
        model.toggleAll(checked);
    }
    function toggle(todoToToggle) {
        model.toggle(todoToToggle);
    }
    function destroy(todo) {
        model.destroy(todo);
    }
    function edit(todo) {
        setEditing(todo.id);
    }
    function save(todoToSave, text) {
        model.save(todoToSave, text);
        setEditing(null);
    }
    function cancel() {
        setEditing(null);
    }
    function clearCompleted() {
        model.clearCompleted();
    }
    var footer;
    var main;
    var todos = model.todos;
    var shownTodos = todos.filter(function (todo) {
        switch (nowShowing) {
            case constants_1.ACTIVE_TODOS:
                return !todo.completed;
            case constants_1.COMPLETED_TODOS:
                return todo.completed;
            default:
                return true;
        }
    });
    var todoItems = shownTodos.map(function (todo) {
        return (React.createElement(todoItem_1.TodoItem, { key: todo.id, todo: todo, onToggle: function () { return toggle(todo); }, onDestroy: function () { return destroy(todo); }, onEdit: function () { return edit(todo); }, editing: editing === todo.id, onSave: function (text) { return save(todo, text); }, onCancel: function (e) { return cancel(); } }));
    });
    var activeTodoCount = todos.reduce(function (accum, todo) {
        return todo.completed ? accum : accum + 1;
    }, 0);
    var completedCount = todos.length - activeTodoCount;
    if (activeTodoCount || completedCount) {
        footer =
            React.createElement(footer_1.TodoFooter, { count: activeTodoCount, completedCount: completedCount, nowShowing: nowShowing, onClearCompleted: function (e) { return clearCompleted(); } });
    }
    if (todos.length) {
        main = (React.createElement("section", { className: "main" },
            React.createElement("input", { id: "toggle-all", className: "toggle-all", type: "checkbox", onChange: function (e) { return toggleAll(e); }, checked: activeTodoCount === 0 }),
            React.createElement("label", { htmlFor: "toggle-all" }, "Mark all as complete"),
            React.createElement("ul", { className: "todo-list" }, todoItems)));
    }
    return (React.createElement("div", null,
        React.createElement("header", { className: "header" },
            React.createElement("h1", null, "todos"),
            React.createElement("input", { ref: newFieldRef, className: "new-todo", placeholder: "What needs to be done?", onKeyDown: function (e) { return handleNewTodoKeyDown(e); }, autoFocus: true })),
        main,
        footer));
}
var model = new todoModel_1.TodoModel('react-todos');
var root = (0, client_1.createRoot)(document.getElementsByClassName('todoapp')[0]);
function render() {
    root.render(React.createElement(TodoApp, { model: model }));
}
model.subscribe(render);
render();
