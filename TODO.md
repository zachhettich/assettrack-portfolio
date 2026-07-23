## Quick Actions navigation fix (only wiring; preserve layout/styling/queries)

- [x] Update src/App.jsx to pass setActivePage into renderDashboardPage props.
- [x] Update src/app/pages/renderDashboardPage.jsx to accept setActivePage and forward it to DashboardPage.
- [ ] Update src/pages/DashboardPage.jsx quick actions cards:
  - [ ] Ensure every enabled Quick Action card navigates via onClick={() => setActivePage(action.page)}
  - [ ] Use exact route mapping required by task for Employee/Admin cards.
  - [x] Keep ONLY “Vehicle Safety Sheet” disabled/Coming soon.
  - [x] Enable Add Asset / Manage Assets / Post Company Update to route "admin".
  - [ ] Preserve employee/admin visibility rules exactly as currently implemented.
- [ ] Verify each enabled action calls setActivePage with one of the valid page IDs above.
