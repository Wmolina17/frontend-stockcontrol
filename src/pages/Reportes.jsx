import { useMemo, useState } from "react";
import { Btn, DataTable, EmptyState, PageHeader } from "../components/ui";
import { Download, RefreshCw } from "../components/icons";
import { api, downloadFile } from "../lib/api";
import { ORDER_STATUS_LABELS } from "../lib/constants";
import { customerName, formatCOP, formatDate } from "../lib/format";

const REPORTS = [
  { value: "inventory", label: "Inventario", hint: "Existencias actuales y últimos movimientos" },
  { value: "sales", label: "Ventas", hint: "Facturación, ingresos y ticket promedio" },
  { value: "orders", label: "Pedidos", hint: "Pedidos por estado y pendientes" },
  { value: "invoices", label: "Facturas", hint: "Historial de facturas emitidas" },
  { value: "customers", label: "Clientes", hint: "Clientes y mayores compradores" },
];

export default function Reportes() {
  const [type, setType] = useState("inventory");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [from, to]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/${type}${query}`);
      setData(res.data || null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("format", "excel");
      await downloadFile(`/reports/${type}?${params.toString()}`, `reporte-${type}.xlsx`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const selected = REPORTS.find((r) => r.value === type);

  return (
    <div className="ui-page">
      <PageHeader
        kicker="Consultas"
        title="Reportes"
        lede="Datos actuales de inventario, ventas, pedidos y clientes."
      />

      <div className="ui-toolbar">
        <div className="ui-filters">
          <select className="ui-select" value={type} onChange={(e) => { setType(e.target.value); setData(null); }}>
            {REPORTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input className="ui-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="ui-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="ui-row-actions">
          <Btn ghost icon={Download} onClick={exportExcel} disabled={exporting}>{exporting ? "Exportando…" : "Excel"}</Btn>
          <Btn primary icon={RefreshCw} onClick={generate} disabled={loading}>{loading ? "Generando…" : "Generar"}</Btn>
        </div>
      </div>
      <p className="ui-hint">{selected?.hint}</p>

      {error && <div className="ui-alert">{error}</div>}

      {!data && !loading && !error && (
        <EmptyState
          title="Sin reporte generado"
          description="Elige el tipo, opcionalmente un rango de fechas, y pulsa Generar."
          action={<Btn primary icon={RefreshCw} onClick={generate}>Generar reporte</Btn>}
        />
      )}

      {data && type === "inventory" && (
        <ReportTable
          title="Inventario actual"
          columns={["Producto", "Stock", "Mínimo", "Precio"]}
          rows={(data.products || []).map((p) => [p.name, p.stock, p.minimumStock, formatCOP(p.price)])}
        />
      )}

      {data && type === "sales" && (
        <>
          <div className="ui-strip">
            <div className="ui-strip-item"><strong>{formatCOP(data.summary?.totalRevenue || 0)}</strong><span>Ingresos</span></div>
            <div className="ui-strip-item"><strong>{data.summary?.count || 0}</strong><span>Facturas</span></div>
            <div className="ui-strip-item"><strong>{formatCOP(data.summary?.avgTicket || 0)}</strong><span>Ticket promedio</span></div>
          </div>
          <ReportTable
            title="Ventas"
            columns={["Factura", "Cliente", "Total", "Fecha"]}
            rows={(data.invoices || []).map((inv) => [inv.invoiceNumber, customerName(inv.customerId), formatCOP(inv.total), formatDate(inv.createdAt)])}
          />
        </>
      )}

      {data && type === "orders" && (
        <>
          <div className="ui-strip">
            {(data.byStatus || []).map((row) => (
              <div className="ui-strip-item" key={row._id}>
                <strong>{row.count}</strong>
                <span>{ORDER_STATUS_LABELS[row._id] || row._id}</span>
              </div>
            ))}
          </div>
          <ReportTable
            title="Pedidos"
            columns={["Pedido", "Cliente", "Estado", "Total"]}
            rows={(data.orders || []).map((o) => [o.orderNumber, customerName(o.customerId), ORDER_STATUS_LABELS[o.status] || o.status, formatCOP(o.total)])}
          />
        </>
      )}

      {data && type === "invoices" && (
        <ReportTable
          title="Facturas"
          columns={["Factura", "Cliente", "Subtotal", "IVA", "Total"]}
          rows={(data.invoices || []).map((inv) => [inv.invoiceNumber, customerName(inv.customerId), formatCOP(inv.subtotal), formatCOP(inv.tax), formatCOP(inv.total)])}
        />
      )}

      {data && type === "customers" && (
        <>
          <ReportTable
            title="Mejores clientes"
            columns={["Cliente", "Facturado", "Compras"]}
            rows={(data.topCustomers || []).map((row) => [row.customer?.name || "Cliente", formatCOP(row.total), row.orders])}
          />
          <ReportTable
            title="Directorio"
            columns={["Nombre", "Correo", "Teléfono"]}
            rows={(data.customers || []).map((c) => [c.name, c.email, c.phone])}
          />
        </>
      )}
    </div>
  );
}

function ReportTable({ title, columns, rows }) {
  return (
    <section className="ui-section">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <EmptyState title="Sin datos" description="No hay información para este reporte en el periodo elegido." />
      ) : (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      )}
    </section>
  );
}
