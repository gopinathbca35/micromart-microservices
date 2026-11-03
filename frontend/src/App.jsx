import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, Users, Package, ShoppingCart, Search, Plus, Bell,
  TrendingUp, ArrowUpRight, MoreHorizontal, Pencil, Trash2, X,
  Menu, ChevronDown, Boxes, CircleDollarSign, Activity, CheckCircle2
} from 'lucide-react'

const API = {
  users: '/api/users',
  products: '/api/products',
  orders: '/api/orders'
}

const emptyForms = {
  users: { name: '', email: '', phone: '', role: 'Customer' },
  products: { name: '', sku: '', category: 'Electronics', price: '', stock: '', description: '' },
  orders: { customer_name: '', product_name: '', quantity: 1, total: '', status: 'Pending' }
}

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))

function App() {
  const [section, setSection] = useState('Overview')
  const [data, setData] = useState({ users: [], products: [], orders: [] })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [u, p, o] = await Promise.all(Object.keys(API).map(k => fetch(API[k]).then(r => {
        if (!r.ok) throw new Error(`Could not load ${k}`)
        return r.json()
      })))
      setData({ users: u, products: p, orders: o })
    } catch (e) {
      setNotice(`${e.message}. Check that Docker services are running.`)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  const stats = useMemo(() => ({
    users: data.users.length,
    products: data.products.length,
    orders: data.orders.length,
    revenue: data.orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0)
  }), [data])

  const sectionKey = section === 'Customers' ? 'users' : section === 'Products' ? 'products' : 'orders'
  const rows = data[sectionKey] || []
  const filtered = rows.filter(item => {
    const text = Object.values(item).join(' ').toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const matchesStatus = sectionKey !== 'orders' || statusFilter === 'All' || item.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForms[sectionKey] })
    setModal(sectionKey)
  }
  const openEdit = item => {
    setEditing(item.id)
    setForm({ ...item })
    setModal(sectionKey)
  }
  const save = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = { ...form }
      if (sectionKey === 'products') {
        payload.price = Number(payload.price)
        payload.stock = Number(payload.stock)
      }
      if (sectionKey === 'orders') {
        payload.quantity = Number(payload.quantity)
        payload.total = Number(payload.total)
      }
      const url = editing ? `${API[sectionKey]}/${editing}` : API[sectionKey]
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Save failed')
      setModal(null)
      setNotice(editing ? 'Record updated successfully' : 'Record created successfully')
      await load()
    } catch (e) { setNotice(e.message) }
    finally { setBusy(false) }
  }
  const remove = async item => {
    if (!window.confirm(`Delete this ${sectionKey.slice(0, -1)}? This cannot be undone.`)) return
    try {
      const r = await fetch(`${API[sectionKey]}/${item.id}`, { method: 'DELETE' })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error || 'Delete failed')
      setNotice('Record deleted successfully')
      load()
    } catch (e) { setNotice(e.message) }
  }

  const nav = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Customers', icon: Users, count: stats.users },
    { name: 'Products', icon: Package, count: stats.products },
    { name: 'Orders', icon: ShoppingCart, count: stats.orders }
  ]

  const title = section === 'Overview' ? 'Overview' : section
  const subtitle = section === 'Overview'
    ? 'Here’s what’s happening with your store today.'
    : `Manage your ${section.toLowerCase()} and keep your store running smoothly.`

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={22}/></div><span>micro<span className="brand-accent">mart</span></span></div>
      <div className="workspace"><div className="workspace-avatar">M</div><div><b>MicroMart Store</b><small>Workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.name} className={`nav-item ${section === n.name ? 'active' : ''}`} onClick={() => {setSection(n.name);setQuery('');setMobileNav(false)}}><n.icon size={18}/><span>{n.name}</span>{n.count !== undefined && <em>{n.count}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="status-card"><div className="status-line"><span className="pulse"></span><b>All systems operational</b></div><small>Microservices are responding normally.</small></div><div className="profile"><div className="profile-avatar">G</div><div><b>Gopinath</b><small>Administrator</small></div><MoreHorizontal size={19}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
        <div className="breadcrumbs">Workspace <span>/</span> <b>{section}</b></div>
        <div className="top-actions"><div className="system-pill"><span className="pulse"></span> System healthy</div><button className="icon-btn notification"><Bell size={19}/><i></i></button><div className="top-avatar">G</div></div>
      </header>

      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">STORE MANAGEMENT</div><h1>{title}</h1><p>{subtitle}</p></div>
          {section !== 'Overview' && <button className="primary-btn" onClick={openCreate}><Plus size={17}/> Add {section === 'Customers' ? 'Customer' : section === 'Products' ? 'Product' : 'Order'}</button>}
        </div>

        {section === 'Overview' ? <Overview stats={stats} data={data} loading={loading} setSection={setSection}/> :
          <section className="panel table-panel">
            <div className="panel-toolbar"><div><h3>All {section}</h3><p>{filtered.length} records found</p></div><div className="toolbar-actions"><div className="search-box"><Search size={16}/><input placeholder={`Search ${section.toLowerCase()}...`} value={query} onChange={e => setQuery(e.target.value)}/></div>{sectionKey === 'orders' && <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Pending</option><option>Processing</option><option>Completed</option><option>Cancelled</option></select>}</div></div>
            {loading ? <div className="empty-state">Loading records...</div> : <DataTable type={sectionKey} rows={filtered} onEdit={openEdit} onDelete={remove}/>}
          </section>
        }
        <footer>© 2026 MicroMart. Built with a microservices architecture. <span>DevOps Project</span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(null)}><div className="modal">
      <div className="modal-head"><div><span className="eyebrow">{editing ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2>{editing ? 'Edit' : 'Add'} {modal === 'users' ? 'Customer' : modal === 'products' ? 'Product' : 'Order'}</h2></div><button className="icon-btn" onClick={() => setModal(null)}><X size={19}/></button></div>
      <form onSubmit={save} className="modal-form">
        {modal === 'users' && <>
          <Field label="Full name" value={form.name} onChange={v=>setForm({...form,name:v})} required placeholder="e.g. Alex Morgan"/>
          <Field label="Email address" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} required placeholder="alex@example.com"/>
          <Field label="Phone number" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+91 98765 43210"/>
          <SelectField label="Customer type" value={form.role} onChange={v=>setForm({...form,role:v})} options={['Customer','VIP','Wholesale']}/>
        </>}
        {modal === 'products' && <>
          <Field label="Product name" value={form.name} onChange={v=>setForm({...form,name:v})} required placeholder="Product name"/>
          <div className="form-grid"><Field label="SKU" value={form.sku} onChange={v=>setForm({...form,sku:v})} required placeholder="MM-001"/><Field label="Category" value={form.category} onChange={v=>setForm({...form,category:v})} placeholder="Electronics"/></div>
          <div className="form-grid"><Field label="Price (INR)" type="number" min="0" value={form.price} onChange={v=>setForm({...form,price:v})} required placeholder="0"/><Field label="Stock quantity" type="number" min="0" value={form.stock} onChange={v=>setForm({...form,stock:v})} required placeholder="0"/></div>
          <Field label="Description" value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="Short product description"/>
        </>}
        {modal === 'orders' && <>
          <Field label="Customer name" value={form.customer_name} onChange={v=>setForm({...form,customer_name:v})} required placeholder="Customer name"/>
          <Field label="Product name" value={form.product_name} onChange={v=>setForm({...form,product_name:v})} required placeholder="Product name"/>
          <div className="form-grid"><Field label="Quantity" type="number" min="1" value={form.quantity} onChange={v=>setForm({...form,quantity:v})} required/><Field label="Total (INR)" type="number" min="0" value={form.total} onChange={v=>setForm({...form,total:v})} required/></div>
          <SelectField label="Order status" value={form.status} onChange={v=>setForm({...form,status:v})} options={['Pending','Processing','Completed','Cancelled']}/>
        </>}
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(null)}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create record'}</button></div>
      </form>
    </div></div>}
    {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>
}

function Field({label,value,onChange,type='text',...props}) {
  return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} onChange={e=>onChange(e.target.value)} {...props}/></label>
}
function SelectField({label,value,onChange,options}) {
  return <label className="field"><span>{label}</span><select value={value ?? options[0]} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>
}

function Overview({stats,data,loading,setSection}) {
  const cards = [
    {label:'Total customers',value:stats.users,icon:Users,tone:'violet',trend:'Registered users'},
    {label:'Active products',value:stats.products,icon:Package,tone:'blue',trend:'Products in catalogue'},
    {label:'Total orders',value:stats.orders,icon:ShoppingCart,tone:'orange',trend:'Orders received'},
    {label:'Total revenue',value:money(stats.revenue),icon:CircleDollarSign,tone:'green',trend:'Excluding cancelled orders'}
  ]
  return <>
    <div className="welcome-banner"><div><span>YOUR STORE AT A GLANCE</span><h2>Good things are happening. ✨</h2><p>Track your store performance and manage everything from one place.</p></div><div className="banner-art"><div className="art-circle"><TrendingUp size={38}/></div></div></div>
    <div className="stats-grid">{cards.map(c=><div className="stat-card" key={c.label}><div className="stat-top"><span>{c.label}</span><div className={`stat-icon ${c.tone}`}><c.icon size={19}/></div></div><strong>{loading?'—':c.value}</strong><div className="stat-foot"><span className="trend"><ArrowUpRight size={14}/></span>{c.trend}</div></div>)}</div>
    <div className="overview-grid">
      <section className="panel recent-panel"><div className="panel-title"><div><h3>Recent orders</h3><p>Your latest customer transactions</p></div><button className="text-btn" onClick={()=>setSection('Orders')}>View all <ArrowUpRight size={15}/></button></div><DataTable type="orders" rows={[...data.orders].slice(-5).reverse()} compact/></section>
      <section className="panel quick-panel"><div className="panel-title"><div><h3>Quick actions</h3><p>Manage your store faster</p></div></div><button onClick={()=>setSection('Customers')}><div className="quick-icon violet"><Users size={18}/></div><span><b>Manage customers</b><small>View and update customer records</small></span><ArrowUpRight size={17}/></button><button onClick={()=>setSection('Products')}><div className="quick-icon blue"><Package size={18}/></div><span><b>Manage products</b><small>Update catalogue and inventory</small></span><ArrowUpRight size={17}/></button><button onClick={()=>setSection('Orders')}><div className="quick-icon orange"><ShoppingCart size={18}/></div><span><b>Manage orders</b><small>Track and update order status</small></span><ArrowUpRight size={17}/></button><div className="micro-status"><Activity size={17}/><div><b>Microservices status</b><small>Connected to three service APIs</small></div><span className="healthy-dot"></span></div></section>
    </div>
  </>
}

function DataTable({type,rows,onEdit,onDelete,compact=false}) {
  const configs = {
    users: {columns:[['name','Customer'],['email','Email'],['phone','Phone'],['role','Type']]},
    products: {columns:[['name','Product'],['sku','SKU'],['category','Category'],['price','Price'],['stock','Stock']]},
    orders: {columns:[['id','Order ID'],['customer_name','Customer'],['product_name','Product'],['total','Total'],['status','Status']]}
  }
  const cols = configs[type].columns
  return <div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c[0]}>{c[1]}</th>)}{!compact && <th className="action-head">Actions</th>}</tr></thead><tbody>
    {rows.length===0 ? <tr><td colSpan={cols.length+(compact?0:1)}><div className="empty-state">No records found. Add your first record to get started.</div></td></tr> : rows.map((r,i)=><tr key={r.id}>
      {cols.map(([key,label])=><td key={key}>{key==='name' && type==='users' ? <div className="person-cell"><div className={`table-avatar avatar-${i%4}`}>{(r.name||'?').charAt(0).toUpperCase()}</div><b>{r.name}</b></div> : key==='price'||key==='total' ? <b>{money(r[key])}</b> : key==='status' ? <span className={`status-badge ${String(r[key]).toLowerCase()}`}>{r[key]}</span> : key==='stock' ? <span className={Number(r[key])<10?'low-stock':''}>{r[key]} units</span> : key==='id' ? <span className="order-id">#MM-{String(r.id).padStart(4,'0')}</span> : r[key] || '—'}</td>)}
      {!compact && <td><div className="row-actions"><button title="Edit" onClick={()=>onEdit(r)}><Pencil size={15}/></button><button title="Delete" className="delete-action" onClick={()=>onDelete(r)}><Trash2 size={15}/></button></div></td>}
    </tr>)}
  </tbody></table></div>
}

export default App
