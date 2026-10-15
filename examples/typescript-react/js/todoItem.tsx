/*jshint quotmark: false */
/*jshint white: false */
/*jshint trailing: false */
/*jshint newcap: false */
/*global React */

/// <reference path="./interfaces.d.ts"/>

import classNames from "classnames";
import * as React from "react";
import { memo, useLayoutEffect, useRef, useState } from "react";
import { ENTER_KEY, ESCAPE_KEY } from "./constants";

function TodoItemComponent(props : ITodoItemProps) {
  const [editText, setEditText] = useState(props.todo.title);
  const editFieldRef = useRef<HTMLInputElement>(null);
  const wasEditingRef = useRef(props.editing);

  function handleSubmit(event : React.SyntheticEvent) {
    var val = editText.trim();
    if (val) {
      props.onSave(val);
      setEditText(val);
    } else {
      props.onDestroy();
    }
  }

  function handleEdit() {
    props.onEdit();
    setEditText(props.todo.title);
  }

  function handleKeyDown(event : React.KeyboardEvent) {
    if (event.keyCode === ESCAPE_KEY) {
      setEditText(props.todo.title);
      props.onCancel(event);
    } else if (event.keyCode === ENTER_KEY) {
      handleSubmit(event);
    }
  }

  function handleChange(event : React.ChangeEvent<HTMLInputElement>) {
    var input : any = event.target;
    setEditText(input.value);
  }

  /**
   * Safely manipulate the DOM after the item switches into editing mode
   * via `props.onEdit()` in `handleEdit` above.
   */
  useLayoutEffect(() => {
    if (!wasEditingRef.current && props.editing) {
      var node = editFieldRef.current;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    }
    wasEditingRef.current = props.editing;
  }, [props.editing]);

  return (
    <li className={classNames({
      completed: props.todo.completed,
      editing: props.editing
    })}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={props.todo.completed}
          onChange={props.onToggle}
        />
        <label onDoubleClick={ e => handleEdit() }>
          {props.todo.title}
        </label>
        <button className="destroy" onClick={props.onDestroy} />
      </div>
      <input
        ref={editFieldRef}
        className="edit"
        value={editText}
        onBlur={ e => handleSubmit(e) }
        onChange={ e => handleChange(e) }
        onKeyDown={ e => handleKeyDown(e) }
      />
    </li>
  );
}

/**
 * This is a completely optional performance enhancement that you can
 * implement on any React component. If you were to remove the `memo`
 * wrapper the app would still work correctly (and still be very
 * performant!), we just use it as an example of how little code it takes
 * to get an order of magnitude performance improvement.
 */
const TodoItem = memo(TodoItemComponent, (prevProps, nextProps) => (
  prevProps.todo === nextProps.todo &&
  prevProps.editing === nextProps.editing
));

export { TodoItem };
