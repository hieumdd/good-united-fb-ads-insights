export type FBAdsOpts = {
  adAccountId: string;
  start?: string | undefined;
  end?: string | undefined;
};

export type FBAdsErr =
  | FBAdsOpts
  | {
      err: string;
    };

export type PollReportId = Promise<[unknown | null, string | null]>;
