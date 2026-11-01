import type { ItemStatus } from "./item-status";

/** Formatos retornados pela API (backend/). Datas chegam como string ISO. */
export type Category = {
  id: string;
  name: string;
  availableItems?: number;
};

export type Item = {
  id: string;
  title: string;
  description: string;
  condition: string;
  imageUrl: string | null;
  status: ItemStatus;
  categoryId: string;
  ownerId: string;
  createdAt: string;
  category: { id: string; name: string };
  owner: { name: string; city: string | null };
  _count: { interests: number };
};

export type Stats = {
  items: { total: number; available: number; reserved: number; donated: number; paused: number };
  users: number;
  interests: number;
  categories: number;
  cities: number;
  updatedAt: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  role: "USER" | "ADMIN" | "VIEWER";
  createdAt: string;
};

export type MyInterest = {
  id: string;
  message: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    status: ItemStatus;
    imageUrl: string | null;
    category: { name: string };
    owner: { name: string; city: string | null };
  };
};
