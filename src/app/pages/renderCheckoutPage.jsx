import AssetCard from "../../components/AssetCard";
import FilterBar from "../../components/FilterBar";

export default function renderCheckoutPage(props) {
  const {
    session,
    checkoutSearch,
    setCheckoutSearch,
    checkoutCategoryFilter,
    setCheckoutCategoryFilter,
    checkoutStatusFilter,
    setCheckoutStatusFilter,
    checkoutLocationFilter,
    setCheckoutLocationFilter,
    categories,
    locations,
    checkoutMineOnly,
    setCheckoutMineOnly,
    filteredCheckoutTools,
    handleCheckout,
    handleCheckIn,
    setActivePage,
    setSelectedDamageTool,
    resetDamageForm,
  } = props;

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Checkout</h2>
            <p>Search, filter, and complete check-out or check-in actions.</p>
          </div>
        </div>

        <FilterBar
          searchValue={checkoutSearch}
          setSearchValue={setCheckoutSearch}
          categoryFilter={checkoutCategoryFilter}
          setCategoryFilter={setCheckoutCategoryFilter}
          statusFilter={checkoutStatusFilter}
          setStatusFilter={setCheckoutStatusFilter}
          locationFilter={checkoutLocationFilter}
          setLocationFilter={setCheckoutLocationFilter}
          categories={categories}
          locations={locations}
          showMineToggle
          checkoutMineOnly={checkoutMineOnly}
          setCheckoutMineOnly={setCheckoutMineOnly}
          resultCount={filteredCheckoutTools.length}
        />
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Checkout Actions</h2>
            <p>
              {filteredCheckoutTools.length} assets match your current filters.
            </p>
          </div>
        </div>

        {filteredCheckoutTools.length === 0 ? (
          <p className="empty-text">No assets match this filter.</p>
        ) : (
          <div className="tool-grid">
            {filteredCheckoutTools.map((tool) => (
              <AssetCard
                key={tool.id}
                tool={tool}
                currentUserEmail={session?.user?.email}
                showActions
                showDamageButton
                onCheckout={handleCheckout}
                onCheckIn={handleCheckIn}
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
