"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "baskets",
    price: "",
    image: "",
    description: "",
    details: "",
    maker: "",
    isNew: false,
    stock: "0",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({
        ...f,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    if (name === "name") {
      setForm((f) => ({
        ...f,
        slug: value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          details: form.details.split("\n").filter(Boolean),
        }),
      });
      if (res.ok) router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400";
  const labelCls = "text-sm text-brown-700 font-sans mb-1 block";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl text-brown-900 mb-8">
        Add Product
      </h1>
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-8 flex flex-col gap-5"
      >
        <div>
          <label className={labelCls}>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="baskets">Baskets</option>
            <option value="florals">Florals</option>
            <option value="stone-art">Stone Art</option>
            <option value="home-decor">Home Decor</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Price (£)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            Image path (e.g. /products/my-image.png)
          </label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Details (one per line)</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            rows={4}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Maker</label>
          <input
            name="maker"
            value={form.maker}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Stock</label>
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            name="isNew"
            type="checkbox"
            checked={form.isNew}
            onChange={handleChange}
            className="accent-rose-400"
          />
          <span className="text-sm text-brown-700 font-sans">
            Mark as New Arrival
          </span>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-rose-400 text-white rounded-full px-8 py-3 font-sans text-sm hover:opacity-90 transition-opacity disabled:opacity-50 self-start"
        >
          {saving ? "Saving…" : "Create Product"}
        </button>
      </form>
    </div>
  );
}
