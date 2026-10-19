import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
export default function Unauthorized(){return <div className="unauthorized-page"><div className="unauthorized-card"><span><ShieldAlert size={34}/></span><h1>Access restricted</h1><p>Your current role does not have permission to open this page.</p><Link to="/dashboard" className="button button-primary">Return to dashboard</Link></div></div>}
