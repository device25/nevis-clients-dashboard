import { z } from 'zod';

const Count = z.int().nonnegative();

// One count per month, Feb 2024 to Jan 2025. A tuple, so a short or long array
// fails validation and `values[11]` is typed as present.
const Values = z.tuple([
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
]);

type MonthlyValues = z.infer<typeof Values>;

// Written out by hand: zod cannot infer a recursive type, and its attempt
// leaks `any` into the emitted declarations that other packages read.
export interface RawClientNode {
  id: string;
  name: string;
  values: MonthlyValues;
  branches?: RawClientNode[] | undefined;
  employees?: RawClientNode[] | undefined;
  channels?: RawClientNode[] | undefined;
}

export const ClientNodeSchema: z.ZodType<RawClientNode> = z.object({
  id: z.string(),
  name: z.string(),
  values: Values,
  get branches() {
    return z.array(ClientNodeSchema).optional();
  },
  get employees() {
    return z.array(ClientNodeSchema).optional();
  },
  get channels() {
    return z.array(ClientNodeSchema).optional();
  },
});
