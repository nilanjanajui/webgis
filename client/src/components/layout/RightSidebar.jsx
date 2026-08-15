/**
 * RightSidebar.jsx
 * Tabbed panel shell (Table | Legend | Details).
 * Auto-switches to "Details" tab when selectedFeatureId changes.
 */

import { useState, useEffect } from "react";
import AttributeTable from "../panels/AttributeTable";
import SpatialAnalytics from "../panels/SpatialAnalytics";
import { useLayersStore } from "../../state/layersStore";

const TABS = [
  { id: "table", label: "Table" },
  { id: "analytics", label: "Analytics" },
  { id: "legend", label: "Legend" },
  { id: "details", label: "Details" },
];

export default function RightSidebar({ LegendComponent, FeatureDetailsComponent }) {
  const [activeTab, setActiveTab] = useState("table");
  const { selectedFeatureId } = useLayersStore();

  // Auto-switch to Details tab when user selects a feature
  useEffect(() => {
    if (selectedFeatureId) setActiveTab("details");
  }, [selectedFeatureId]);

  return (
    <aside className="right-sidebar" id="right-sidebar" aria-label="Data panel">
      <nav className="right-sidebar__tabs" role="tablist" aria-label="Panel tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`right-panel-${tab.id}`}
            id={`right-tab-${tab.id}`}
            className={`right-sidebar__tab ${activeTab === tab.id ? "right-sidebar__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="right-sidebar__content">
        {activeTab === "table" && (
          <div role="tabpanel" id="right-panel-table" aria-labelledby="right-tab-table">
            <AttributeTable />
          </div>
        )}

        {activeTab === "analytics" && (
          <div role="tabpanel" id="right-panel-analytics" aria-labelledby="right-tab-analytics">
            <SpatialAnalytics />
          </div>
        )}

        {activeTab === "legend" && (
          <div role="tabpanel" id="right-panel-legend" aria-labelledby="right-tab-legend">
            {LegendComponent
              ? <LegendComponent />
              : <div className="right-sidebar__placeholder" id="legend-placeholder">Legend panel (Dev A)</div>
            }
          </div>
        )}

        {activeTab === "details" && (
          <div role="tabpanel" id="right-panel-details" aria-labelledby="right-tab-details">
            {FeatureDetailsComponent
              ? <FeatureDetailsComponent />
              : <div className="right-sidebar__placeholder" id="details-placeholder">Feature details panel (Dev A)</div>
            }
          </div>
        )}
      </div>
    </aside>
  );
}