# Migration notes: `examples/typescript-react` React 16 → React 19

PR: https://github.com/shashankjohari/todomvc/pull/1

## Scope

Only `examples/typescript-react` was still on React 16 (`react`/`react-dom` `^16.7.0`). The other React apps in the repo, `examples/react` and `examples/react-redux`, were already on React `^19.2.5`, and this PR leaves them alone. The only shared code touched is the Cypress spec (`cypress/e2e/spec.cy.js`).

## 1. What the React 16 app did

This is the TypeScript + React version of TodoMVC. It is a "legacy" example: compiled output is committed and `index.html` loads it directly, with no dev server or bundler config.

- **Build:** `npm run build` ran TypeScript 2.9 (`tsc -p ./js/`, CommonJS, ES5, classic `jsx: "react"`), then browserify 16 bundled `js/app.js` into `js/bundle.js`. The bundle contains the React development build. `js/*.js` and `js/bundle.js` were both committed.
- **Runtime:** `index.html` loads `node_modules/director/build/director.js`, which provides the global `Router` for hash routing, plus the CSS from `todomvc-common` and `todomvc-app-css`. It then loads `js/bundle.js`.
- **Data:** `TodoModel` (plain TS class) keeps the todos and saves them to `localStorage` under `react-todos`. `subscribe(cb)` registers listeners, and every change calls `inform()`, which saves and then runs each listener.
- **Rendering:** `app.tsx` registered a `render()` that called `ReactDOM.render(<TodoApp model={model}/>, .todoapp)`, so every model change re-rendered from the top through the legacy root.
- **Components** (all classes):
  - `TodoApp`: state was `{ nowShowing, editing }`. `componentDidMount` set up the `director` router (`/`, `/active`, `/completed`), and each route called `setState`. It read the new-todo input with `ReactDOM.findDOMNode(this.refs["newField"])` (string ref + `findDOMNode`).
  - `TodoItem`: state was `{ editText }`. `shouldComponentUpdate` compared only `todo`, `editing` and `editText`. When editing went false → true, `componentDidUpdate` focused the edit input and moved the cursor to the end, using `findDOMNode(this.refs["editField"])`.
  - `TodoFooter`: shows the count, filter links and the "Clear completed" button.
- **Dependencies:** the example committed its entire `node_modules` tree, about 2,500 files (React 16, TypeScript 2.9, browserify and all their dependencies).
- **APIs from the original checklist:** `componentWillMount`, `componentWillUpdate` and `defaultProps` did not appear anywhere. The React 16 APIs that actually blocked React 19 were `ReactDOM.render`, `ReactDOM.findDOMNode` and string refs, all of which React 19 removes.

## 2. Changes and why

### Dependencies (`examples/typescript-react/package.json`)
| Package | Before | After | Why |
|---|---|---|---|
| `react`, `react-dom` | `^16.7.0` | `19.2.8` | The migration target. |
| `@types/react` / `@types/react-dom` | `^16.7.0` / `^16.0.11` (dependencies) | `19.2.18` / `19.2.7` (devDependencies) | Types matching React 19. They are only needed to build. |
| `typescript` | `^2.9.2` | `5.9.3` | TS 2.9 can't parse the React 19 type definitions. |
| `browserify` | `^16.2.3` | `17.0.1` | Current stable version. Bundles React 19's CommonJS build without issue. |
| `classnames` | `^2.2.6` | `2.5.1` | Ships its own types. |
| `@types/classnames` | `^2.2.6` | removed | Deprecated stub, no longer needed. |

- Added a `package-lock.json` for reproducible installs.
- Added an example-level `"test": "cd ../.. && CYPRESS_framework=typescript-react npm test"`. The root `npm test` throws unless a framework is specified.

### Source (`examples/typescript-react/js/`)
- **`app.tsx`**
  - `ReactDOM.render` → `createRoot`. The root is created once, and `render()` calls `root.render(<TodoApp model={model}/>)`, so the "re-render on every model change" design is unchanged.
  - `TodoApp` is now a function component. `useState` replaces `nowShowing`/`editing`, `useEffect(..., [])` replaces the router setup in `componentDidMount`, and `useRef` replaces the `newField` string ref + `findDOMNode`.
  - Handlers that were `.bind(this, todo)` are now arrow functions.
- **`todoItem.tsx`**
  - Function component. `useState` holds `editText`, and `useRef` replaces the `editField` string ref + `findDOMNode`.
  - `componentDidUpdate` focus logic → `useLayoutEffect` on `props.editing`. A "was editing" ref keeps it firing only on the false → true transition, as before. `useLayoutEffect` runs at the same point in the commit as `componentDidUpdate`.
  - `shouldComponentUpdate` → `React.memo(TodoItemComponent, (prev, next) => prev.todo === next.todo && prev.editing === next.editing)`. This is the same prop comparison. Local state changes still re-render, as the old `nextState.editText` check allowed.
- **`footer.tsx`:** function component with destructured props, no logic changes.
- **`interfaces.d.ts`:** removed `ITodoItemState` and `IAppState`, which no longer have a class to describe.
- **`tsconfig.json`:**
  - Removed `suppressImplicitAnyIndexErrors`, which is an error in TS ≥ 5.5 and had no effect anyway with `noImplicitAny: false`.
  - Removed `filesGlob` (an old Atom editor key) and the top-level `baseUrl`/`typeRoots`, which sat outside `compilerOptions` and were ignored.
  - Added `lib: ["dom","es2015"]` (needed by the React 19 types), `skipLibCheck: true`, and `types: []`. `types: []` stops `tsc` from picking up `@types/*` from the repo-root `node_modules` (Cypress/Node types), which broke the build.
- **Compiled output:** regenerated `js/*.js` and `js/bundle.js` with the new toolchain. `constants.js`, `todoModel.js` and `utils.js` differ only by TS 5's `exports.X = void 0` boilerplate.
- `todoModel.ts`, `utils.ts` and `constants.ts` are unchanged, so business logic is untouched.

### Shared Cypress spec (`cypress/e2e/spec.cy.js`)
These were needed to make the tests pass. They fix problems in the tests themselves, which were already failing before the migration:
- `invoke('reset')` → `invoke('resetHistory')`. The sinon spies created by `cy.spy` no longer have `reset`.
- Added `shouldBeHiddenOrAbsent(selector)` and used it in place of `should('not.be.visible')` for `.main`, `.footer` and `.clear-completed`. Since Cypress 6, `not.be.visible` fails on elements that don't exist, but the spec's own comment says apps may either remove or hide them.
- The persistence test's `testState()` now re-queries `selectors.todoItems` instead of using the `@firstTodo`/`@secondTodo` aliases. After `cy.reload()` the aliased elements are detached from the page, and aliases created after `.then()` can't be re-queried in Cypress 12+.

## 3. Decisions made beyond the original ask

1. **Only migrated `examples/typescript-react`.** It was the only React 16 code in the repo.
2. **Upgraded TypeScript 2.9 → 5.9 and browserify 16 → 17.** Not asked for, but React 19's types can't be compiled without it. I kept `target: es5`, CommonJS and `jsx: "react"` (classic runtime) to keep the output as close to before as possible.
3. **Pinned exact versions instead of `^` ranges.** There was no lockfile, and `^` would have pulled in releases only hours or days old at the time (react 19.3.1, typescript 7.0.2). I also added `package-lock.json`.
4. **Stopped committing the full `node_modules` tree.** The example now tracks only the four files `index.html` loads, as `typescript-angular` and `typescript-backbone` already do, and adds `examples/typescript-react/.gitignore` (`node_modules`). Otherwise the commit would have either swapped about 2.5k vendored files for a new tree or left React 16 code in the repo.
5. **Replaced `findDOMNode`/string refs with `useRef`.** Not in the checklist, but React 19 removes them and the app crashes without this.
6. **Kept the `shouldComponentUpdate` optimization as `React.memo`**, with the original comment adapted, instead of dropping it.
7. **Fixed the shared Cypress spec** instead of adding `typescript-react` to `tests/knownIssues.js`. Marking the tests as known issues would have hidden real coverage.
8. **Added an example-level `test` script** so `npm test` inside the example runs the suite against this app.
9. **Suggested Devin environment settings** (not part of the repo): install Node 22, run root `npm install`, plus notes on testing and serving. These are approved and live in Devin's settings, not in this PR.

## 4. Test results

All results are from local runs. The repo has no CI.

| Run | Before (React 16, original spec) | After (React 19, fixed spec) |
|---|---|---|
| `npm run build` (example) | not reproducible as committed with the root deps installed (TS 2.9 picked up the root `@types`) | ✅ passes |
| `typescript-react` Cypress spec (29 tests) | ❌ 22 passed, 5 failed, 2 skipped | ✅ 29 passed |
| `typescript-angular` Cypress spec (control: not migrated, spec fix only) | ❌ 28 passed, 1 failed (persistence) | ✅ 29 passed |
| `npm run test:all` (angular, preact, react, react-redux, svelte, vue) | ✅ all pass (angular 27 + 2 pending, others 28 + 1 pending) | ✅ all pass, same counts |
| `grep` for `ReactDOM.render`, `findDOMNode`, `componentWill*`, `defaultProps`, `extends React`, `this.refs`, string refs in example sources | n/a | no matches |

The 5 tests that failed before were:
- "should hide #main and #footer"
- "should allow me to add todo items"
- the "before each" hook for "should allow me to mark all items as completed"
- "Clear completed button should be hidden when there are no items that are completed"
- "should persist its data"

They failed identically before and after the React upgrade, until the spec fixes. That is why they are counted as spec problems, not migration regressions.

**Manual UI testing** (desktop Chrome, committed bundle): passed. This covered:
- adding (trimmed input, empty input ignored, autofocus)
- editing: cursor goes to the end, Enter/blur save, Escape cancels, empty text deletes
- single toggle and toggle-all, with correct counts
- Clear completed visibility and destroy
- filters, URL hashes and back/forward
- persistence across reload
- empty state hides main and footer
- no React console warnings

One automated uppercase keypress was dropped once during the cursor-position check and went through on retry; no app defect was found.

## 5. Risks for reviewers

- **Shared spec changes affect every framework.** Verified only on the main set, `typescript-react` and `typescript-angular`, not the full `node tests/cya.js --all` sweep. Two things may change for other legacy apps:
  - `shouldBeHiddenOrAbsent` is more permissive by design.
  - `resetHistory` lets those apps get further through tests that used to crash.
  Both may change which legacy apps pass.
- **Bare root `npm test` still fails** without `CYPRESS_framework=<name>`. That was already true before. Use `npm test` inside `examples/typescript-react`, or `CYPRESS_framework=typescript-react npm test` at the root.
- **Legacy root → concurrent root.** `createRoot` updates are scheduled and batched, not run synchronously like `ReactDOM.render`. All automated and manual flows pass, but any outside code expecting the DOM to update synchronously right after a model change would behave differently. None exists in this repo.
- **`React.memo` comparator ignores callback props.** `TodoItem` keeps the callbacks from its last render until `todo` or `editing` changes, the same trade-off as the old `shouldComponentUpdate`. It's safe today because the callbacks only close over the stable `model` and state setters. A future callback that closes over changing state would go stale.
- **The `node_modules` change is a workflow change.** A fresh clone has only the four runtime files, so building the example requires `npm install` first. The gulp `copy` task globs `examples/**` from disk, so a locally installed `node_modules` would be copied into `dist/` (as the committed tree was before).
- **The PR diff is large** (about 2.5k deleted `node_modules` files, plus the regenerated `bundle.js`). Review the source with `git diff master -- examples/typescript-react/js/*.ts* examples/typescript-react/package.json cypress/`.
- **`bundle.js` is a React development build**, as it was before (no `NODE_ENV=production` envify step). Fine for a demo, but slower and larger than production.
- **Exact pins** mean no automatic patch updates for React or TypeScript. `target: es5` is deprecated in newer TypeScript majors (6+), so a future TS upgrade will need a target bump.
