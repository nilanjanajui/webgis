/**
 * RightSidebar.jsx
 * Tabbed panel shell for the right side of the app.
 *
 * Tabs:
 *  - "Table"   → AttributeTable (Dev B owns)
 *  - "Legend"  → Plug-in slot for Dev A's Legend component
 *  - "Details" → Plug-in slot for Dev A's FeatureDetails component
 *
 * Dev A can drop their components in by replacing the placeholder <div> slots.
 */

import { useState } from "react";
import AttributeTable from "../panels/AttributeTable";

const TABS = [
  { id: "table", label: "Table" },
  { id: "legend", label: "Legend" },
  { id: "details", label: "Details" },
];

export default function RightSidebar({ LegendComponent, FeatureDetailsComponent }) {
  const [activeTab, setActiveTab] = useState("table");

  return (
    <aside className="right-sidebar" id="right-sidebar" aria-label="Data panel">
      {/* Tab bar */}
      <nav className="right-sidebar__tabs" role="tablist" aria-label="Panel tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`right-panel-${tab.id}`}
            id={`right-tab-${tab.id}`}
            className={`right-sidebar__tab ${
              activeTab === tab.id ? "right-sidebar__tab--active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Panel content */}
      <div className="right-sidebar__content">
        {/* Table tab — Dev B */}
        <div
          role="tabpanel"
          id="right-panel-table"
          aria-labelledby="right-tab-table"
          hidden={activeTab !== "table"}
        >
          <AttributeTable />
        </div>

        {/* Legend tab — Dev A plug-in slot */}
        <div
          role="tabpanel"
          id="right-panel-legend"
          aria-labelledby="right-tab-legend"
          hidden={activeTab !== "legend"}
        >
          {LegendComponent ? (
            <LegendComponent />
          ) : (
            <div className="right-sidebar__placeholder" id="legend-placeholder">
              Legend panel (Dev A)
            </div>
          )}
        </div>

        {/* Details tab — Dev A plug-in slot */}
        <div
          role="tabpanel"
          id="right-panel-details"
          aria-labelledby="right-tab-details"
          hidden={activeTab !== "details"}
        >
          {FeatureDetailsComponent ? (
            <FeatureDetailsComponent />
          ) : (
            <div className="right-sidebar__placeholder" id="details-placeholder">
              Feature details panel (Dev A)
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
