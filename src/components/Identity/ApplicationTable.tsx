```typescript
import {
  Column,
  ColumnFormat,
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableRow,
  TableCell,
  useTableFeatures,
  TableColumnDefinition,
  createTable,
} from "@fluentui/react-components";
import React from "react";

interface Application {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string | null;
  accountEnabled: boolean;
  applicationVisibility: "Visible" | "Hidden";
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

const applicationColumns: TableColumnDefinition<Application>[] = [
  createTable(
    {
      columnId: "displayName",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Display Name</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.displayName}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "id",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>ID</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.id}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "appId",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>App ID</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.appId}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "createdDateTime",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Created</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.createdDateTime.split("T")[0]}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "applicationType",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Application Type</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.applicationType ?? "N/A"}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "accountEnabled",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Enabled</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.accountEnabled ? "True" : "False"}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "applicationVisibility",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Visibility</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.applicationVisibility}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "assignmentRequired",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>Assignment Required</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.assignmentRequired ? "True" : "False"}</DataGridCell>;
      },
    }
  ),
  createTable(
    {
      columnId: "isAppProxy",
    },
    {
      renderHeaderCell: () => {
        return <DataGridHeaderCell>App Proxy</DataGridHeaderCell>;
      },
      renderCell: (item) => {
        return <DataGridCell>{item.isAppProxy ? "True" : "False"}</DataGridCell>;
      },
    }
  ),
];

export function ApplicationTable({
  applications,
}: {
  applications: Application[];
}) {
  const table = useTableFeatures<Application>({
    columns: applicationColumns,
    items: applications,
    // selectionMode: "multiselect", // Enable if you want multi-select checkboxes
  });
  const { dataGridView } = table;

  return (
    <DataGrid
      items={applications}
      columns={applicationColumns}
      sortable
      // selectionMode={table.selectionMode} // Pass selectionMode from table features
      // getRowId={table.getRowId} // Pass getRowId from table features
      // onSelectionChange={table.handleSelectionChange} // Pass handleSelectionChange from table features
      // currentRowId={table.currentRowId} // Pass currentRowId from table features
      // onCurrentRowChange={table.handleCurrentRowChange} // Pass handleCurrentRowChange from table features
      // resizing
      // style={{ minWidth: "700px" }} // Adjust as needed
    >
      <DataGridHeader>
        <DataGridRow
          selectionCell={{ /* ...table.selectionCell */ }}
        >
          {({ renderHeaderCell }) => (
            <>{renderHeaderCell()} </>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<Application>>
        {(item) => (
          <DataGridRow<Application>
            key={item.id}
            // selectionCell={table.selectionCell({ item, getRowId: table.getRowId })} // Pass selectionCell from table features
          >
            {({ renderCell }) => <>{renderCell(item)}</>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}
```