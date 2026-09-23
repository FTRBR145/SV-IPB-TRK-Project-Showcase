import { downloadCsv } from '../../services/exportFiles';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import DataTablesReact from 'datatables.net-react';
import DataTablesCore from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './DataTable.css';
import { Download } from 'lucide-react';

const registerDataTables = DataTablesReact.use;
registerDataTables(DataTablesCore);

function normalizeCellValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

export default function DataTable({
  data = [],
  columns = [],
  searchPlaceholder = 'Cari data...',
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  extraHeaderActions = null,
  defaultSortKey = '',
  defaultSortDirection = 'asc',
  showExportCsv = false,
  exportFileName = 'data-export.csv',
  emptyMessage = 'Tidak ada data yang ditemukan.',
  searchTerm = '',
  isRowInvalid,
  selectionState,
  isRowSelected,
  isRowSelectionDisabled
}) {
  const tableRef = useRef(null);
  const sortId = useId();
  const [query, setQuery] = useState(searchTerm);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortSelection, setSortSelection] = useState(defaultSortKey ? `${defaultSortKey}:${defaultSortDirection}` : '');
  const columnsRef = useRef(columns);
  const rowStateRef = useRef({ isRowInvalid, isRowSelected, isRowSelectionDisabled });
  columnsRef.current = columns;
  rowStateRef.current = { isRowInvalid, isRowSelected, isRowSelectionDisabled };

  const syncRowState = (row, data) => {
    if (!row) return;
    const currentState = rowStateRef.current;
    row.classList.toggle('table-row-invalid', Boolean(currentState.isRowInvalid?.(data)));

    const selectionControl = row.querySelector('[data-selection-control]');
    if (!selectionControl) return;
    const selected = Boolean(currentState.isRowSelected?.(data));
    row.classList.toggle('table-row-selected', selected);
    selectionControl.setAttribute('aria-checked', String(selected));
    selectionControl.setAttribute(
      'aria-label',
      selected ? selectionControl.dataset.deselectLabel : selectionControl.dataset.selectLabel
    );
    selectionControl.disabled = Boolean(currentState.isRowSelectionDisabled?.(data));
  };

  const dataTableColumns = useMemo(() => {
    const weights = columns.map(column => column.weight || ({ title: 2.4, course: 1.8, student: 1.6, name: 1.8, email: 1.8, actions: 1.3 }[column.key] || 1));
    const hasActions = columns.some(column => column.key === 'actions');
    const totalWeight = weights.reduce((sum, weight, index) => sum + (columns[index].key === 'actions' ? 0 : weight), 0);
    return columns.map((column, index) => ({
      data: column.key || null,
      name: column.key || `column-${index}`,
      orderable: column.sortable !== false && Boolean(column.key),
      searchable: column.searchable !== false && Boolean(column.key),
      className: column.className || '',
      width: column.key === 'actions' ? '10rem' : hasActions
        ? `calc((100% - 10rem) * ${weights[index] / totalWeight})`
        : `${weights[index] / totalWeight * 100}%`,
      createdCell: (cell) => { cell.setAttribute('role', 'cell'); },
      defaultContent: ''
    }));
  }, [columns]);

  const slots = useMemo(() => {
    const renderSlots = {};

    columns.forEach((column, index) => {
      renderSlots[index] = (cellData, type, row, meta) => {
        const currentColumn = columnsRef.current[index];
        const rawValue = currentColumn?.key ? row[currentColumn.key] : cellData;

        if (type === 'filter' && currentColumn.searchValue) return currentColumn.searchValue(row);
        if (type !== 'display') return normalizeCellValue(rawValue);
        return (
          <div className="table-cell">
            <span className="table-cell-label" aria-hidden="true">{currentColumn.label}</span>
            <div className="table-cell-value">
              {currentColumn.render ? currentColumn.render(row, meta.row) : normalizeCellValue(rawValue)}
            </div>
          </div>
        );
      };
    });

    return renderSlots;
  }, [columns]);

  const defaultSortIndex = columns.findIndex((column) => column.key === defaultSortKey);
  const order = defaultSortIndex >= 0 ? [[defaultSortIndex, defaultSortDirection]] : [];

  useEffect(() => {
    setQuery(searchTerm);
    const table = tableRef.current?.dt();
    if (table && table.search() !== searchTerm) table.search(searchTerm).draw();
  }, [searchTerm]);

  useEffect(() => {
    const table = tableRef.current?.dt();
    if (!table) return;
    table.rows({ page: 'current' }).every(function syncVisibleRow() {
      syncRowState(this.node(), this.data());
    });
  }, [selectionState]);

  const changeSort = (event) => {
    const selection = event.target.value;
    setSortSelection(selection);
    const [key, direction] = selection.split(':');
    const index = columns.findIndex(column => column.key === key);
    tableRef.current?.dt()?.order(index < 0 ? [] : [[index, direction]]).draw();
  };

  const handleExportCsv = () => {
    const table = tableRef.current?.dt();
    const exportData = table
      ? table.rows({ search: 'applied', order: 'applied' }).data().toArray()
      : data;

    if (exportData.length === 0) return;

    const exportColumns = columns.filter((column) => column.key && column.exportable !== false);
    downloadCsv(exportFileName, [
      exportColumns.map(column => column.label || column.key),
      ...exportData.map(item => exportColumns.map(column => normalizeCellValue(item[column.key])))
    ]);
  };

  return (
    <div className="data-table-shell min-w-0 w-full space-y-3">
      {extraHeaderActions && <div className="min-w-0 max-w-full">{extraHeaderActions}</div>}
      <div className="table-toolbar">
        <label className="table-length-control">
          Tampilkan
          <select aria-label="Jumlah baris per halaman" value={pageSize} onChange={event => {
            const size = Number(event.target.value);
            setPageSize(size);
            tableRef.current?.dt()?.page.len(size).draw();
          }}>
            {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          data
        </label>
        <label className="table-search-control">
          Cari:
          <input type="search" value={query} placeholder={searchPlaceholder} onChange={event => {
            setQuery(event.target.value);
            tableRef.current?.dt()?.search(event.target.value).draw();
          }} />
        </label>
        {showExportCsv && <button type="button" onClick={handleExportCsv} className="table-export-control inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" title="Unduh hasil tabel dalam format CSV"><Download size={14} className="text-sky-600" /> Unduh CSV</button>}
      </div>

      <div className="admin-datatable">
        <div className="table-mobile-sort">
          <label htmlFor={sortId}>Urutkan data</label>
          <select id={sortId} value={sortSelection} onChange={changeSort}>
            <option value="">Urutan awal</option>
            {columns.filter(column => column.key && column.sortable !== false).flatMap(column => [
              <option key={`${column.key}:asc`} value={`${column.key}:asc`}>{column.label} · naik</option>,
              <option key={`${column.key}:desc`} value={`${column.key}:desc`}>{column.label} · turun</option>
            ])}
          </select>
        </div>
        <DataTablesReact
          ref={tableRef}
          data={data}
          columns={dataTableColumns}
          slots={slots}
          className="w-full text-left"
          onOrder={() => {
            const currentOrder = tableRef.current?.dt()?.order();
            if (!currentOrder) return;
            const [index, direction] = currentOrder[0] || [];
            const key = columnsRef.current[index]?.key;
            setSortSelection(key ? `${key}:${direction}` : '');
          }}
          options={{
            rowCallback: syncRowState,
            autoWidth: false,
            scrollX: false,
            search: { search: searchTerm },
            createdRow: (row) => row.setAttribute('role', 'row'),
            deferRender: true,
            pageLength: defaultPageSize,
            lengthMenu: pageSizeOptions,
            order,
            pagingType: 'simple_numbers',
            layout: {
              topStart: null,
              topEnd: null,
              bottomStart: 'info',
              bottomEnd: 'paging'
            },
            language: {
              emptyTable: emptyMessage,
              zeroRecords: emptyMessage,
              search: 'Cari:',
              searchPlaceholder,
              lengthMenu: 'Tampilkan _MENU_ data',
              info: 'Menampilkan _START_–_END_ dari _TOTAL_ data',
              infoEmpty: 'Tidak ada data',
              infoFiltered: '(difilter dari _MAX_ data)',
              paginate: {
                first: 'Pertama',
                last: 'Terakhir',
                previous: 'Sebelumnya',
                next: 'Berikutnya',
                number: 'Halaman %d'
              },
              aria: {
                orderable: ': Urutkan kolom ini',
                orderableReverse: ': Balikkan urutan kolom ini',
                orderableRemove: ': Hapus urutan kolom ini',
                paginate: {
                  first: 'Halaman pertama',
                  last: 'Halaman terakhir',
                  previous: 'Halaman sebelumnya',
                  next: 'Halaman berikutnya',
                  number: 'Halaman '
                }
              }
            }
          }}
        >
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th scope="col" key={column.key || index} className={column.headerClassName || ''}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </DataTablesReact>
      </div>
    </div>
  );
}
