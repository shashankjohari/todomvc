"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoItem = void 0;
var classnames_1 = require("classnames");
var React = require("react");
var react_1 = require("react");
var constants_1 = require("./constants");
function TodoItemComponent(props) {
    var _a = (0, react_1.useState)(props.todo.title), editText = _a[0], setEditText = _a[1];
    var editFieldRef = (0, react_1.useRef)(null);
    var wasEditingRef = (0, react_1.useRef)(props.editing);
    function handleSubmit(event) {
        var val = editText.trim();
        if (val) {
            props.onSave(val);
            setEditText(val);
        }
        else {
            props.onDestroy();
        }
    }
    function handleEdit() {
        props.onEdit();
        setEditText(props.todo.title);
    }
    function handleKeyDown(event) {
        if (event.keyCode === constants_1.ESCAPE_KEY) {
            setEditText(props.todo.title);
            props.onCancel(event);
        }
        else if (event.keyCode === constants_1.ENTER_KEY) {
            handleSubmit(event);
        }
    }
    function handleChange(event) {
        var input = event.target;
        setEditText(input.value);
    }
    (0, react_1.useLayoutEffect)(function () {
        if (!wasEditingRef.current && props.editing) {
            var node = editFieldRef.current;
            node.focus();
            node.setSelectionRange(node.value.length, node.value.length);
        }
        wasEditingRef.current = props.editing;
    }, [props.editing]);
    return (React.createElement("li", { className: (0, classnames_1.default)({
            completed: props.todo.completed,
            editing: props.editing
        }) },
        React.createElement("div", { className: "view" },
            React.createElement("input", { className: "toggle", type: "checkbox", checked: props.todo.completed, onChange: props.onToggle }),
            React.createElement("label", { onDoubleClick: function (e) { return handleEdit(); } }, props.todo.title),
            React.createElement("button", { className: "destroy", onClick: props.onDestroy })),
        React.createElement("input", { ref: editFieldRef, className: "edit", value: editText, onBlur: function (e) { return handleSubmit(e); }, onChange: function (e) { return handleChange(e); }, onKeyDown: function (e) { return handleKeyDown(e); } })));
}
var TodoItem = (0, react_1.memo)(TodoItemComponent, function (prevProps, nextProps) { return (prevProps.todo === nextProps.todo &&
    prevProps.editing === nextProps.editing); });
exports.TodoItem = TodoItem;
