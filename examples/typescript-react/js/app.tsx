/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, Router*/

/// <reference path="./interfaces.d.ts"/>

declare var Router;
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { TodoModel } from "./todoModel";
import { TodoFooter } from "./footer";
import { TodoItem } from "./todoItem";
import { ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS, ENTER_KEY } from "./constants";

function TodoApp({ model } : IAppProps) {
  const [nowShowing, setNowShowing] = useState<string>(ALL_TODOS);
  const [editing, setEditing] = useState<string | null>(null);
  const newFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    var router = Router({
      '/': () => setNowShowing(ALL_TODOS),
      '/active': () => setNowShowing(ACTIVE_TODOS),
      '/completed': () => setNowShowing(COMPLETED_TODOS)
    });
    router.init('/');
  }, []);

  function handleNewTodoKeyDown(event : React.KeyboardEvent) {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    event.preventDefault();

    var val = newFieldRef.current.value.trim();

    if (val) {
      model.addTodo(val);
      newFieldRef.current.value = '';
    }
  }

  function toggleAll(event : React.ChangeEvent<HTMLInputElement>) {
    var target : any = event.target;
    var checked = target.checked;
    model.toggleAll(checked);
  }

  function toggle(todoToToggle : ITodo) {
    model.toggle(todoToToggle);
  }

  function destroy(todo : ITodo) {
    model.destroy(todo);
  }

  function edit(todo : ITodo) {
    setEditing(todo.id);
  }

  function save(todoToSave : ITodo, text : String) {
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
  const todos = model.todos;

  var shownTodos = todos.filter((todo) => {
    switch (nowShowing) {
    case ACTIVE_TODOS:
      return !todo.completed;
    case COMPLETED_TODOS:
      return todo.completed;
    default:
      return true;
    }
  });

  var todoItems = shownTodos.map((todo) => {
    return (
      <TodoItem
        key={todo.id}
        todo={todo}
        onToggle={() => toggle(todo)}
        onDestroy={() => destroy(todo)}
        onEdit={() => edit(todo)}
        editing={editing === todo.id}
        onSave={(text) => save(todo, text)}
        onCancel={ e => cancel() }
      />
    );
  });

  // Note: It's usually better to use immutable data structures since they're
  // easier to reason about and React works very well with them. That's why
  // we use map(), filter() and reduce() everywhere instead of mutating the
  // array or todo items themselves.
  var activeTodoCount = todos.reduce(function (accum, todo) {
    return todo.completed ? accum : accum + 1;
  }, 0);

  var completedCount = todos.length - activeTodoCount;

  if (activeTodoCount || completedCount) {
    footer =
      <TodoFooter
        count={activeTodoCount}
        completedCount={completedCount}
        nowShowing={nowShowing}
        onClearCompleted={ e => clearCompleted() }
      />;
  }

  if (todos.length) {
    main = (
      <section className="main">
        <input
          id="toggle-all"
          className="toggle-all"
          type="checkbox"
          onChange={ e => toggleAll(e) }
          checked={activeTodoCount === 0}
        />
        <label
          htmlFor="toggle-all"
        >
          Mark all as complete
        </label>
        <ul className="todo-list">
          {todoItems}
        </ul>
      </section>
    );
  }

  return (
    <div>
      <header className="header">
        <h1>todos</h1>
        <input
          ref={newFieldRef}
          className="new-todo"
          placeholder="What needs to be done?"
          onKeyDown={ e => handleNewTodoKeyDown(e) }
          autoFocus={true}
        />
      </header>
      {main}
      {footer}
    </div>
  );
}

var model = new TodoModel('react-todos');
var root = createRoot(document.getElementsByClassName('todoapp')[0]);

function render() {
  root.render(<TodoApp model={model}/>);
}

model.subscribe(render);
render();
