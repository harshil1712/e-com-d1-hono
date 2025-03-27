import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  inventory: number;
  last_updated: string;
  created_at: string;
}

const updateProduct = async (
  session: D1DatabaseSession,
  id: string,
  product: Partial<Product>
) => {
  try {
    const updates = Object.entries(product)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => `${key} = ?`)
      .join(", ");

    if (!updates) {
      throw new Error("No valid fields to update");
    }

    const values = Object.entries(product)
      .filter(([_, value]) => value !== undefined)
      .map(([_, value]) => value);

    const statement = session.prepare(
      `UPDATE products SET ${updates} WHERE id = ?`
    );
    const results = await statement.bind(...[...values, id]).run();

    return { results, latestBookmark: session.getBookmark() };
  } catch (error) {
    throw new Error(
      `Failed to update product in database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const createProduct = async (
  session: D1DatabaseSession,
  product: Omit<Product, "created_at" | "last_updated">
) => {
  try {
    const now = new Date().toISOString();
    const fields = [...Object.keys(product), "created_at", "last_updated"];

    const values = [...Object.values(product), now, now];

    const statement = session.prepare(
      `INSERT INTO products (${fields.join(", ")}) VALUES (${fields
        .map(() => "?")
        .join(", ")})`
    );
    const results = await statement.bind(...values).run();
    return { results, latestBookmark: session.getBookmark() };
  } catch (error: unknown) {
    throw new Error(
      `Failed to create product in database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const getProduct = async (session: D1DatabaseSession, id: string) => {
  try {
    if (!id) {
      throw new Error("No ID provided");
    }
    const tsStart = Date.now();
    const { results, meta } = await session
      .prepare("SELECT * FROM products WHERE id = ?")
      .bind(id)
      .run();
    const d1Duration = Date.now() - tsStart;
    const latestBookmark = session.getBookmark();
    return { results, latestBookmark, meta, d1Duration };
  } catch (error) {
    throw new Error(
      `Failed to get product from database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const getProducts = async (session: D1DatabaseSession) => {
  try {
    // used to measure the total duration
    const tsStart = Date.now();

    // get all products from the database
    const { results, meta } = await session
      .prepare("SELECT * FROM products")
      .run();

    // Calculate the total duration
    const d1Duration = Date.now() - tsStart;

    const latestBookmark = session.getBookmark();

    return { results, latestBookmark, meta, d1Duration };
  } catch (error) {
    throw new Error(
      `Failed to get products from database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/products", async (c) => {
  const db = c.env.DB;

  // get bookmark from the cookie
  const bookmark = getCookie(c, "product_bookmark") || "first-unconstrained";

  // pass bookmark to the session
  const session = db.withSession(bookmark);

  // get products from the database
  const products = await getProducts(session);

  // set bookmark to the cookie
  products.latestBookmark &&
    setCookie(c, "product_bookmark", products.latestBookmark, {
      maxAge: 60 * 60,
    });

  return c.json(products);
});

app.get("/api/products/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const bookmark = getCookie(c, "product_bookmark") || "first-unconstrained";

  // pass bookmark to the session
  const session = db.withSession(bookmark);

  const product = await getProduct(session, id);

  // set bookmark to the cookie
  product.latestBookmark &&
    setCookie(c, "product_bookmark", product.latestBookmark, {
      maxAge: 60 * 60,
    });

  return c.json(product);
});

app.post("/api/product", async (c) => {
  const db = c.env.DB;
  const product = await c.req.json();
  const { id } = product;

  const session = db.withSession();

  try {
    const existingProduct = await getProduct(session, id);
    if (existingProduct.results.length > 0) {
      const updatedProduct = await updateProduct(session, id, product);

      // set bookmark to the cookie
      updatedProduct.latestBookmark &&
        setCookie(c, "product_bookmark", updatedProduct.latestBookmark, {
          maxAge: 60 * 60,
        });

      return c.json({
        message: "Product updated successfully",
        servedByPrimary: updatedProduct.results.meta.served_by_primary,
      });
    }

    const newProduct = await createProduct(session, product);

    // set bookmark to the cookie
    newProduct.latestBookmark &&
      setCookie(c, "product_bookmark", newProduct.latestBookmark, {
        maxAge: 60 * 60,
      });

    return c.json({
      message: "Product created successfully",
      servedByPrimary: newProduct.results.meta.served_by_primary,
    });
  } catch (error) {
    console.error(error);
    return c.text("Failed to create product");
  }
});

export default app;
