import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { Product, Table, Order, PaymentRecord, PrintJob } from '../types.ts';
import { INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_ORDERS, generatePastPayments } from '../data/initialData.ts';

const PRODUCTS_COL = 'products';
const TABLES_COL = 'tables';
const ORDERS_COL = 'orders';
const PAYMENTS_COL = 'paymentRecords';
const PRINT_JOBS_COL = 'printJobs';

// --- PRODUCTS ---
export async function getFirestoreProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COL));
    if (snapshot.empty) {
      // Seed initial products in background without blocking return
      Promise.all(INITIAL_PRODUCTS.map(p => setDoc(doc(db, PRODUCTS_COL, p.id), p))).catch(err => {
        console.warn('Background product seeding warning:', err);
      });
      return [...INITIAL_PRODUCTS];
    }
    const list = snapshot.docs.map(d => d.data() as Product);
    return list.length > 0 ? list : [...INITIAL_PRODUCTS];
  } catch (err) {
    console.error('Error reading products from Firestore:', err);
    return [...INITIAL_PRODUCTS];
  }
}

export async function saveFirestoreProduct(product: Product): Promise<Product> {
  try {
    await setDoc(doc(db, PRODUCTS_COL, product.id), product);
  } catch (err) {
    console.error('Error saving product to Firestore:', err);
  }
  return product;
}

export async function deleteFirestoreProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, id));
  } catch (err) {
    console.error('Error deleting product from Firestore:', err);
  }
}

// --- TABLES ---
export async function getFirestoreTables(): Promise<Table[]> {
  try {
    const snapshot = await getDocs(collection(db, TABLES_COL));
    if (snapshot.empty) {
      // Seed initial tables in background
      Promise.all(INITIAL_TABLES.map(t => setDoc(doc(db, TABLES_COL, t.id), t))).catch(err => {
        console.warn('Background table seeding warning:', err);
      });
      return deduplicateTableList([...INITIAL_TABLES]);
    }
    const tables = snapshot.docs.map(d => d.data() as Table);
    return deduplicateTableList(tables);
  } catch (err) {
    console.error('Error reading tables from Firestore:', err);
    return deduplicateTableList([...INITIAL_TABLES]);
  }
}

export function deduplicateTableList(tablesList: Table[]): Table[] {
  const map = new Map<string, Table>();
  tablesList.forEach(t => {
    const key = t.number && Number(t.number) > 0 
      ? `num-${t.number}`
      : `name-${(t.name || '').toLowerCase().replace(/\s+/g, '').replace(/^mesa0*/i, '')}`;
    
    if (!map.has(key)) {
      map.set(key, t);
    } else {
      const existing = map.get(key)!;
      if (existing.status !== 'OCCUPIED' && t.status === 'OCCUPIED') {
        map.set(key, t);
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
}

export async function saveFirestoreTable(table: Table): Promise<Table> {
  try {
    await setDoc(doc(db, TABLES_COL, table.id), table);
  } catch (err) {
    console.error('Error saving table to Firestore:', err);
  }
  return table;
}

export async function deleteFirestoreTable(tableId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TABLES_COL, tableId));
  } catch (err) {
    console.error('Error deleting table from Firestore:', err);
  }
}

// --- ORDERS ---
export async function getFirestoreOrders(): Promise<Order[]> {
  try {
    const snapshot = await getDocs(collection(db, ORDERS_COL));
    if (snapshot.empty) {
      return [];
    }
    const orders = snapshot.docs.map(d => d.data() as Order);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error reading orders from Firestore:', err);
    return [];
  }
}

export async function saveFirestoreOrder(order: Order): Promise<Order> {
  try {
    await setDoc(doc(db, ORDERS_COL, order.id), order);
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }
  return order;
}

export async function deleteFirestoreOrder(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ORDERS_COL, orderId));
  } catch (err) {
    console.error('Error deleting order from Firestore:', err);
  }
}

// --- PAYMENTS ---
export async function getFirestorePaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, PAYMENTS_COL));
    if (snapshot.empty) {
      return [];
    }
    const records = snapshot.docs.map(d => d.data() as PaymentRecord);
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Error reading payment records from Firestore:', err);
    return [];
  }
}

export async function saveFirestorePaymentRecord(record: PaymentRecord): Promise<PaymentRecord> {
  try {
    await setDoc(doc(db, PAYMENTS_COL, record.id), record);
  } catch (err) {
    console.error('Error saving payment record to Firestore:', err);
  }
  return record;
}

// --- PRINT JOBS ---
export async function getFirestorePrintJobs(): Promise<PrintJob[]> {
  try {
    const snapshot = await getDocs(collection(db, PRINT_JOBS_COL));
    const jobs = snapshot.docs.map(d => d.data() as PrintJob);
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error reading print jobs from Firestore:', err);
    return [];
  }
}

export async function saveFirestorePrintJob(job: PrintJob): Promise<PrintJob> {
  try {
    await setDoc(doc(db, PRINT_JOBS_COL, job.id), job);
  } catch (err) {
    console.error('Error saving print job to Firestore:', err);
  }
  return job;
}

// --- RESET ALL DATA ---
export async function resetFirestoreData(): Promise<void> {
  try {
    // Delete existing
    const pSnap = await getDocs(collection(db, PRODUCTS_COL));
    pSnap.forEach(d => deleteDoc(d.ref));

    const tSnap = await getDocs(collection(db, TABLES_COL));
    tSnap.forEach(d => deleteDoc(d.ref));

    const oSnap = await getDocs(collection(db, ORDERS_COL));
    oSnap.forEach(d => deleteDoc(d.ref));

    const paySnap = await getDocs(collection(db, PAYMENTS_COL));
    paySnap.forEach(d => deleteDoc(d.ref));

    const pjSnap = await getDocs(collection(db, PRINT_JOBS_COL));
    pjSnap.forEach(d => deleteDoc(d.ref));

    // Re-seed products and free tables
    for (const p of INITIAL_PRODUCTS) await setDoc(doc(db, PRODUCTS_COL, p.id), p);
    for (const t of INITIAL_TABLES) await setDoc(doc(db, TABLES_COL, t.id), t);
  } catch (err) {
    console.error('Error resetting Firestore data:', err);
  }
}

export async function clearFirestoreSalesData(): Promise<void> {
  try {
    const oSnap = await getDocs(collection(db, ORDERS_COL));
    oSnap.forEach(d => deleteDoc(d.ref));

    const paySnap = await getDocs(collection(db, PAYMENTS_COL));
    paySnap.forEach(d => deleteDoc(d.ref));

    const pjSnap = await getDocs(collection(db, PRINT_JOBS_COL));
    pjSnap.forEach(d => deleteDoc(d.ref));

    // Reset all tables to FREE
    for (const t of INITIAL_TABLES) await setDoc(doc(db, TABLES_COL, t.id), t);
  } catch (err) {
    console.error('Error clearing sales data in Firestore:', err);
  }
}
