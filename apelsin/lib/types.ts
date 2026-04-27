export type Family = {
  id: string;
  leaderId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: string;
  /** true — вступить по коду нельзя (семья «закрыта») */
  closedToJoins?: boolean;
};

export type SessionUser = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  familyId: string | null;
  monthQrSpendRub: number;
};
export type PublicUser = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
};
