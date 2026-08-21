import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, DataTable, IconBtn, SearchInput } from "../components/ui";
import { Download, Eye, X } from "../components/icons";
import { api, downloadFile } from "../lib/api";
import { customerName, formatCOP, formatDate, orderNumber, productName } from "../lib/format";

export default function Facturacion() {
  const [invoices, setInvoices] = useState([]);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("search", query.trim());
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const invRes = await api.get(`/invoices?${params.toString()}`);
      setInvoices(invRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPeriodo = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.total || 0), 0), [invoices]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  async function openDetail(invoice) {
    try {
      const res = await api.get(`/invoices/${invoice._id}`);
      setDetail(res.data);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function downloadPdf(invoice) {
    try {
      await downloadFile(`/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="ui-page">
      <header className="ui-head">
        <div>
          <p className="ui-kicker">Ventas</p>
          <h2 className="ui-title">Facturación</h2>
          <p className="ui-lede">
            Las facturas se generan automáticamente cuando un pedido pasa a <strong>En proceso</strong>.
            Aquí puedes consultarlas y descargar el PDF.
          </p>
        </div>
      </header>

      <div className="ui-strip">
        <div className="ui-strip-item">
          <strong>{invoices.length}</strong>
          <span>Facturas del filtro</span>
        </div>
        <div className="ui-strip-item">
          <strong>{formatCOP(totalPeriodo)}</strong>
          <span>Total del periodo</span>
        </div>
      </div>

      <div className="ui-toolbar">
        <div className="ui-filters">
          <SearchInput
            placeholder="Buscar por factura o cliente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input className="ui-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="ui-meta">→</span>
          <input className="ui-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="ui-empty">Cargando facturas…</div>
      ) : error ? (
        <div className="ui-empty"><strong>No se pudo cargar</strong>{error}</div>
      ) : invoices.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th className="ui-num">Total</th>
              <th className="ui-num ui-actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td className="ui-name">{inv.invoiceNumber}</td>
                <td>{orderNumber(inv.orderId)}</td>
                <td>{customerName(inv.customerId)}</td>
                <td>{formatDate(inv.createdAt)}</td>
                <td className="ui-num">{formatCOP(inv.total)}</td>
                <td>
                  <div className="ui-row-actions">
                    <IconBtn icon={Eye} label="Ver factura" onClick={() => openDetail(inv)} />
                    <IconBtn icon={Download} label="Descargar PDF" onClick={() => downloadPdf(inv)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <div className="ui-empty">
          <strong>No hay facturas</strong>
          Aún no hay pedidos en proceso. Cuando operaciones marque un pedido como &quot;En proceso&quot;, la factura aparecerá aquí.
        </div>
      )}

      {detail && (
        <div className="ui-overlay" onClick={() => setDetail(null)}>
          <div className="ui-modal is-wide" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-head">
              <div>
                <p className="ui-kicker">Factura</p>
                <h2>{detail.invoiceNumber}</h2>
                <p>{formatDate(detail.createdAt)} · Pedido {orderNumber(detail.orderId)}</p>
              </div>
              <button type="button" className="ui-close" onClick={() => setDetail(null)} aria-label="Cerrar">
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <dl className="ui-dl">
              <div>
                <dt>Cliente</dt>
                <dd>{customerName(detail.customerId)}</dd>
              </div>
              <div>
                <dt>Pedido origen</dt>
                <dd>{orderNumber(detail.orderId)}</dd>
              </div>
            </dl>
            <table className="ui-table">
              <thead>
                <tr><th>Producto</th><th className="ui-num">Cant.</th><th className="ui-num">Precio</th><th className="ui-num">Subtotal</th></tr>
              </thead>
              <tbody>
                {(detail.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{productName(item.productId)}</td>
                    <td className="ui-num">{item.quantity}</td>
                    <td className="ui-num">{formatCOP(item.price)}</td>
                    <td className="ui-num">{formatCOP(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ui-totals">
              <div className="ui-totals-row"><span>Subtotal</span><span>{formatCOP(detail.subtotal)}</span></div>
              <div className="ui-totals-row"><span>IVA</span><span>{formatCOP(detail.tax)}</span></div>
              <div className="ui-totals-row is-total"><span>Total</span><span>{formatCOP(detail.total)}</span></div>
            </div>
            <div className="ui-actions">
              <Btn ghost onClick={() => setDetail(null)}>Cerrar</Btn>
              <Btn primary icon={Download} onClick={() => downloadPdf(detail)}>Descargar PDF</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ui-toast">{toast}</div>}
    </div>
  );
}
