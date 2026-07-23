import AssetCard from "../../components/AssetCard";
import FilterBar from "../../components/FilterBar";

export default function renderInventoryPage(props) {
  const {
    session,
    inventorySearch,
    setInventorySearch,
    inventoryCategoryFilter,
    setInventoryCategoryFilter,
    inventoryStatusFilter,
    setInventoryStatusFilter,
    inventoryLocationFilter,
    setInventoryLocationFilter,
    inventoryAssetTypeFilter,
    setInventoryAssetTypeFilter,
    inventoryDamageFilter,
    setInventoryDamageFilter,
    categories,
    locations,
    filteredInventoryTools,
    inventoryCounts,
    setActivePage,
    setSelectedDamageTool,
    resetDamageForm,
  } = props;

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Inventory</h2>
            <p>
              Browse tools and vehicles by type, status, location, and damage.
            </p>
          </div>
        </div>

        <FilterBar
          searchValue={inventorySearch}
          setSearchValue={setInventorySearch}
          categoryFilter={inventoryCategoryFilter}
          setCategoryFilter={setInventoryCategoryFilter}
          statusFilter={inventoryStatusFilter}
          setStatusFilter={setInventoryStatusFilter}
          locationFilter={inventoryLocationFilter}
          setLocationFilter={setInventoryLocationFilter}
          categories={categories}
          locations={locations}
          resultCount={filteredInventoryTools.length}
        >
          <select
            className="filter-control"
            value={inventoryAssetTypeFilter}
            onChange={(e) => setInventoryAssetTypeFilter(e.target.value)}
          >
            <option value="">All Asset Types</option>
            <option value="tool">Tools</option>
            <option value="vehicle">Vehicles</option>
          </select>

          <select
            className="filter-control"
            value={inventoryDamageFilter}
            onChange={(e) => setInventoryDamageFilter(e.target.value)}
          >
            <option value="">All Damage States</option>
            <option value="none">No Damage</option>
            <option value="reported">Reported</option>
            <option value="inreview">In Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </FilterBar>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Filtered Total</span>
          <strong>{inventoryCounts.total}</strong>
        </div>
        <div className="stat-card">
          <span>Available</span>
          <strong>{inventoryCounts.available}</strong>
        </div>
        <div className="stat-card">
          <span>Checked Out</span>
          <strong>{inventoryCounts.checkedOut}</strong>
        </div>
        <div className="stat-card">
          <span>Damaged</span>
          <strong>{inventoryCounts.damaged}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Inventory List</h2>
            <p>{filteredInventoryTools.length} assets match your filters.</p>
          </div>
        </div>

        {filteredInventoryTools.length === 0 ? (
          <p className="empty-text">No assets found.</p>
        ) : (
          <div className="tool-grid">
            {filteredInventoryTools.map((tool) => (
              <AssetCard
                key={tool.id}
                tool={tool}
                currentUserEmail={session?.user?.email}
                showDamageButton
                onReportDamage={(selectedTool) => {
                  setActivePage("damage");
                  setSelectedDamageTool(selectedTool);
                  resetDamageForm();
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
