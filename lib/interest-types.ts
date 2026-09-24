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

export type OwnerInterestPanelData = {
  role: "owner";
  total: number;
  interests: InterestWithUser[];
  ownInterest: null;
};

export type VisitorInterestPanelData = {
  role: "visitor";
  total: number;
  interests: [];
  ownInterest: InterestSummary | null;
};

export type AnonymousInterestPanelData = {
  role: "anonymous";
  total: number;
  interests: [];
  ownInterest: null;
};

export type InterestPanelData =
  | OwnerInterestPanelData
  | VisitorInterestPanelData
  | AnonymousInterestPanelData;
