export type InterestSummary = {
  id: string;
  message: string;
  createdAt: string;
};

export type InterestWithUser = InterestSummary & {
  user: {
    name: string;
    email: string;
  };
};

export type InterestPanelData =
  | { role: "owner"; total: number; interests: InterestWithUser[]; ownInterest: null }
  | { role: "visitor"; total: number; interests: []; ownInterest: InterestSummary | null }
  | { role: "anonymous"; total: number; interests: []; ownInterest: null };
