import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AuditLog } from "@/types/auditLog"; // Assuming you have a types directory for shared types

const AuditLogsPage = () => {
  const { data: session, status } = useSession();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (session?.user?.role !== "admin") {
        setError("You do not have permission to view audit logs.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/admin/audit-logs");
        if (!response.ok) {
          throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        }
        const data: AuditLog[] = await response.json();
        setAuditLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchAuditLogs();
    } else if (status === "unauthenticated") {
      setError("Please log in to view audit logs.");
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Error
        </Typography>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" color="warning">
          Access Denied
        </Typography>
        <Typography>
          You do not have the necessary permissions to view this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell component="th" scope="row">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.userEmail || "System"}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AuditLogsPage;