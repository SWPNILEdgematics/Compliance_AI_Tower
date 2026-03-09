// components/ToolResponseRenderer.tsx
import React from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  alpha,
  useTheme,
} from "@mui/material";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolResponseData } from "@/hooks/useStream";

interface ToolResponseRendererProps {
  data: ToolResponseData;
}

const ToolResponseRenderer: React.FC<ToolResponseRendererProps> = ({ data }) => {
  const theme = useTheme();

  if (data.type === 'markdown') {
    return (
      <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.content}
        </ReactMarkdown>
      </Paper>
    );
  }

  if (data.type === 'table') {
    const { headers, rows } = data.content;
    
    if (!headers || !rows || rows.length === 0) {
      return <Typography color="text.secondary">No table data available</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header: string) => (
                <TableCell key={header} sx={{ fontWeight: 600 }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any, index: number) => (
              <TableRow key={index}>
                {headers.map((header: string) => (
                  <TableCell key={`${index}-${header}`}>
                    {row[header]?.toString() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (data.type === 'options') {
    return (
      <List sx={{ mt: 1, bgcolor: alpha(theme.palette.primary.main, 0.02), p: 2, borderRadius: 1 }}>
        {data.content.map((option: string, index: number) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText primary={`${index + 1}. ${option}`} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
    );
  }

  // Default text display
  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
        {data.content}
      </Typography>
    </Paper>
  );
};

export default ToolResponseRenderer;