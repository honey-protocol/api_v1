import { MongoClient, ServerApiVersion } from 'mongodb';
const config = process.env;
const uri = `mongodb+srv://root:${config.DB_PASSWORD}@cluster0.lo85kgq.mongodb.net/?retryWrites=true&w=majority`;

export const mongoClient = new MongoClient(uri, { 
    // useNewUrlParser: true, 
    // useUnifiedTopology: true, 
    serverApi: ServerApiVersion.v1 });

export interface ReserveState {
    market_id: string;
    accrued_until: string;
    outstanding_debt: string;
    uncollected_fees: string;
    protocol_uncollected_fees: string;
    total_deposits: string;
    total_deposit_notes: string;
    total_loan_notes: string;
    last_updated: string;
    invalidated: number;
    created_at: number;
}