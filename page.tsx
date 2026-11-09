"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, ChartNoAxesCombined, Package, Boxes, Bell, FileBarChart, Settings, Search, CalendarDays, ArrowUpRight, ArrowDownRight, Sparkles, Clock3, Plus, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type Product = { id:number; sku:string; name:string; category:string; price:number; cost:number; stock:number; reorder_level:number };
type Forecast = { product_id:number; product:string; sku:string; forecasted_units:number; current_stock:number; recommended_order:number; action:string; daily_average:number };
const nav = [
  ["Dashboard", LayoutDashboard], ["Forecasts", ChartNoAxesCombined], ["Products", Package],
  ["Inventory", Boxes], ["Alerts", Bell], ["Reports", FileBarChart], ["Settings", Settings]
] as const;
const sales = [{m:"Jan",actual:42,forecast:48},{m:"Feb",actual:55,forecast:53},{m:"Mar",actual:49,forecast:58},{m:"Apr",actual:68,forecast:64},{m:"May",actual:73,forecast:76},{m:"Jun",actual:82,forecast:88}];

export default function Home() {
  const [section,setSection] = useState("Dashboard");
  const [products,setProducts] = useState<Product[]>([]);
  const [forecasts,setForecasts] = useState<Forecast[]>([]);
  const [summary,setSummary] = useState({total_products:0,total_units:0,low_stock:0,inventory_value:0,units_sold_30d:0,forecast_accuracy:92});
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [showAdd,setShowAdd] = useState(false);
  const [form,setForm] = useState({sku:"",name:"",category:"Apparel",price:"",cost:"",stock:"",reorder_level:"10"});

  async function load() {
    setLoading(true); setError("");
    try {
      const [p,s,f] = await Promise.all([
        fetch(`${API}/api/products`).then(r=>{if(!r.ok) throw new Error("Products API failed"); return r.json();}),
        fetch(`${API}/api/summary`).then(r=>r.json()),
        fetch(`${API}/api/forecasts?days=30`).then(r=>r.json())
      ]);
      setProducts(p); setSummary(s); setForecasts(f.items || []);
    } catch(e) { setError("Cannot connect to backend. Start FastAPI on port 8000."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load();},[]);
  const filtered = useMemo(()=>products.filter(p=>(p.name+" "+p.sku).toLowerCase().includes(search.toLowerCase())),[products,search]);
  const money = (n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

  async function addProduct(e:React.FormEvent) {
    e.preventDefault();
    const response = await fetch(`${API}/api/products`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,price:Number(form.price),cost:Number(form.cost),stock:Number(form.stock),reorder_level:Number(form.reorder_level)})});
    if(!response.ok){const d=await response.json(); alert(d.detail || "Could not add product");return;}
    setShowAdd(false); setForm({sku:"",name:"",category:"Apparel",price:"",cost:"",stock:"",reorder_level:"10"}); load();
  }

  return <main className="min-h-screen flex">
    <aside className="hidden md:flex w-[230px] bg-white border-r border-slate-200 flex-col p-5 fixed inset-y-0">
      <div className="text-[28px] font-black tracking-tight text-[#242044] mb-9">merchy<span className="text-violet">.</span></div>
      <div className="text-[10px] uppercase tracking-[.18em] text-slate-400 font-bold mb-3">Workspace</div>
      <nav className="space-y-1">{nav.map(([label,Icon])=><button key={label} onClick={()=>setSection(label)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${section===label?"bg-violet-50 text-violet":"text-slate-500 hover:bg-slate-50"}`}><Icon size={17}/>{label}</button>)}</nav>
      <div className="mt-auto rounded-2xl bg-[#f1efff] p-4"><div className="w-8 h-8 rounded-xl bg-violet text-white grid place-items-center mb-3"><Sparkles size={17}/></div><b className="text-sm">Let Merchy do the heavy lifting.</b><p className="text-xs text-slate-500 mt-1 leading-5">Use demand insights to make smarter inventory decisions.</p></div>
    </aside>

    <section className="md:ml-[230px] w-full p-5 md:p-8 max-w-[1600px]">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div><div className="text-xs text-slate-400 mb-1">Workspace / {section}</div><h1 className="text-2xl font-bold">{section==="Dashboard"?"Forecast Overview":section}</h1><p className="text-sm text-slate-500 mt-1">Track forecasting metrics and inventory insights.</p></div>
        <div className="flex items-center gap-2"><div className="hidden sm:flex items-center gap-2 bg-white border rounded-xl px-3 py-2 text-sm text-slate-400"><CalendarDays size={15}/> May 12 – Jun 11, 2026</div><button onClick={load} className="p-2.5 rounded-xl border bg-white hover:bg-slate-50"><RefreshCw size={17}/></button><div className="w-9 h-9 rounded-full bg-violet-100 text-violet grid place-items-center font-bold">M</div></div>
      </header>

      {error && <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">{error}</div>}
      {section==="Dashboard" && <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            ["Total Products",summary.total_products.toString(),"In your catalog",Package],
            ["Inventory Units",summary.total_units.toLocaleString(),"Current stock",Boxes],
            ["Potential Stockouts",summary.low_stock.toString(),"Products at reorder level",Bell],
            ["Inventory Value",money(summary.inventory_value),"Based on product cost",ChartNoAxesCombined]
          ].map(([label,value,sub,Icon]:any)=><div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"><div className="flex justify-between text-sm text-slate-500"><span>{label}</span><Icon size={17}/></div><div className="text-2xl font-bold mt-4">{loading?"—":value}</div><div className="text-xs text-slate-400 mt-2">{sub}</div></div>)}
        </div>
        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5 mb-6">
          <div className="bg-white rounded-2xl border p-5"><div className="flex justify-between items-center mb-5"><div><h2 className="font-bold">Sales demand overview</h2><p className="text-xs text-slate-400 mt-1">Illustrative trend • connect sales history for live data</p></div><span className="text-xs bg-violet-50 text-violet px-3 py-1.5 rounded-lg">6 months</span></div><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sales}><defs><linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6554E8" stopOpacity={.25}/><stop offset="100%" stopColor="#6554E8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f5"/><XAxis dataKey="m" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="actual" stroke="#6554E8" fill="url(#fillActual)" strokeWidth={2.5}/><Area type="monotone" dataKey="forecast" stroke="#19A88A" fill="none" strokeDasharray="5 5" strokeWidth={2}/></AreaChart></ResponsiveContainer></div><div className="flex gap-5 text-xs text-slate-500"><span>● Actual sales</span><span className="text-emerald-600">● Forecast</span></div></div>
          <div className="bg-white rounded-2xl border p-5"><h2 className="font-bold">Inventory health</h2><p className="text-xs text-slate-400 mt-1">Stock levels by product</p><div className="h-[260px] mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={products.slice(0,5)} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={120} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="stock" fill="#7667E9" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></div>
        </div>
      </>}

      {(section==="Products" || section==="Inventory" || section==="Dashboard") && <div className="bg-white rounded-2xl border overflow-hidden mb-6">
        <div className="p-5 flex flex-wrap justify-between items-center gap-3"><div><h2 className="font-bold">{section==="Inventory"?"Inventory levels":"Top products"}</h2><p className="text-xs text-slate-400 mt-1">Manage your product catalog and stock</p></div><div className="flex gap-2"><div className="flex items-center border rounded-xl px-3 gap-2"><Search size={15} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." className="py-2 text-sm outline-none w-36"/></div><button onClick={()=>setShowAdd(true)} className="bg-violet text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus size={16}/> Add product</button></div></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs"><tr>{["Product","SKU","Category","Price","Stock","Status"].map(x=><th key={x} className="text-left px-5 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>{filtered.map(p=><tr key={p.id} className="border-t hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold">{p.name}</td><td className="px-5 py-4 text-slate-500">{p.sku}</td><td className="px-5 py-4 text-slate-500">{p.category}</td><td className="px-5 py-4">{money(p.price)}</td><td className="px-5 py-4 font-semibold">{p.stock}</td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock<=p.reorder_level?"bg-rose-50 text-rose-600":"bg-emerald-50 text-emerald-700"}`}>{p.stock<=p.reorder_level?"Low stock":"Healthy"}</span></td></tr>)}</tbody></table>{!filtered.length&&<div className="p-8 text-center text-sm text-slate-400">No products found.</div>}</div>
      </div>}

      {(section==="Forecasts" || section==="Dashboard") && <div className="bg-white rounded-2xl border overflow-hidden mb-6"><div className="p-5"><h2 className="font-bold">Top forecasted products</h2><p className="text-xs text-slate-400 mt-1">30-day demand estimate using the baseline forecasting API</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Product","Forecasted units","Current stock","Recommended order","Action"].map(x=><th key={x} className="text-left px-5 py-3">{x}</th>)}</tr></thead><tbody>{forecasts.map(f=><tr key={f.product_id} className="border-t"><td className="px-5 py-4 font-semibold">{f.product}<div className="text-xs text-slate-400">{f.sku}</div></td><td className="px-5 py-4">{f.forecasted_units}</td><td className="px-5 py-4">{f.current_stock}</td><td className="px-5 py-4">{f.recommended_order}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${f.action==="Increase stock"?"bg-emerald-50 text-emerald-700":f.action==="Reduce stock"?"bg-rose-50 text-rose-700":"bg-blue-50 text-blue-700"}`}>{f.action}</span></td></tr>)}</tbody></table></div></div>}

      {section==="Alerts" && <div className="bg-white rounded-2xl border p-5"><h2 className="font-bold mb-4">Inventory alerts</h2>{products.filter(p=>p.stock<=p.reorder_level).map(p=><div key={p.id} className="flex justify-between border-b py-4"><div><b>{p.name}</b><p className="text-xs text-slate-500 mt-1">Stock {p.stock} · Reorder level {p.reorder_level}</p></div><span className="text-xs text-rose-600 bg-rose-50 rounded-full px-3 py-1 h-fit">Low stock</span></div>)}</div>}
      {section==="Reports" && <div className="bg-white rounded-2xl border p-6"><h2 className="font-bold">Reports & analytics</h2><p className="text-sm text-slate-500 mt-2">Inventory valuation: {money(summary.inventory_value)} · Units sold in last 30 days: {summary.units_sold_30d}</p><p className="text-xs text-slate-400 mt-4">CSV/PDF export can be added in the next development stage.</p></div>}
      {section==="Settings" && <div className="bg-white rounded-2xl border p-6"><h2 className="font-bold">Settings</h2><p className="text-sm text-slate-500 mt-2">Merchy demo workspace · API: {API}</p></div>}

      <footer className="text-xs text-slate-400 py-5">© 2026 Merchy · Forecast smarter. Stock better. Sell more.</footer>
    </section>

    {showAdd&&<div className="fixed inset-0 bg-slate-950/40 grid place-items-center p-4 z-50"><form onSubmit={addProduct} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"><div className="flex justify-between mb-5"><h2 className="font-bold text-lg">Add product</h2><button type="button" onClick={()=>setShowAdd(false)}>✕</button></div><div className="grid grid-cols-2 gap-3">{[["sku","SKU"],["name","Product name"],["category","Category"],["price","Price"],["cost","Cost"],["stock","Stock"],["reorder_level","Reorder level"]].map(([key,label])=><label key={key} className="text-xs text-slate-500">{label}<input required value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="block w-full mt-1 border rounded-lg p-2.5 text-sm text-slate-900 outline-violet"/></label>)}</div><button className="w-full mt-5 bg-violet text-white rounded-xl py-3 font-semibold">Save product</button></form></div>}
  </main>;
}
