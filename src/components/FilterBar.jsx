/*
  FilterBar.jsx
  ---------------------------------------
  Reusable filter/search bar.

  This file controls:
  - Search input
  - Category filter
  - Status filter
  - Location filter
  - Optional "My Assets" toggle
  - Result count display
  - Optional extra filter controls passed in as children

  Used by pages like:
  - Inventory
  - Checkout
*/

export default function FilterBar({
  searchValue,
  setSearchValue,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  categories = [],
  locations = [],
  showMineToggle = false,
  checkoutMineOnly = false,
  setCheckoutMineOnly = () => {},
  resultCount = 0,
  children = null,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-search">
        <input
          className="filter-search-input"
          type="text"
          placeholder="Search by name, tag, category, vehicle details, or location"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="filter-bar-row">
        <select
          className="filter-control"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="filter-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="checked_out">Checked Out</option>
        </select>

        <select
          className="filter-control"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        {showMineToggle ? (
          <label className="filter-check">
            <input
              type="checkbox"
              checked={checkoutMineOnly}
              onChange={(e) => setCheckoutMineOnly(e.target.checked)}
            />
            <span>My Assets</span>
          </label>
        ) : (
          <div className="filter-summary-chip">{resultCount} results</div>
        )}
      </div>

      {children ? (
        <div className="button-row" style={{ marginTop: 14 }}>
          {children}
        </div>
      ) : null}

      {showMineToggle ? (
        <div className="filter-summary-chip">{resultCount} results</div>
      ) : null}
    </div>
  );
}
