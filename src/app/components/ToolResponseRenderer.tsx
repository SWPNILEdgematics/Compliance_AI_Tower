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
  Box,
} from "@mui/material";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { styled } from '@mui/material/styles';
import { ToolResponseData } from "@/hooks/useStream";

interface ToolResponseRendererProps {
  data: ToolResponseData;
}


// Styled components
const MarkdownContainer = styled(Box)(({ theme }) => ({
  '& h1': {
    fontSize: '2rem',
    fontWeight: 700,
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
    color: '#1a237e',
    borderBottom: '2px solid #e8eaf6',
    paddingBottom: theme.spacing(1),
  },
  '& h2': {
    fontSize: '1.75rem',
    fontWeight: 600,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
    color: '#283593',
  },
  '& h3': {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(1),
    color: '#3949ab',
  },
  '& h4': {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    color: '#5c6bc0',
  },
  '& p': {
    fontSize: '1rem',
    lineHeight: 1.7,
    marginBottom: theme.spacing(1.5),
    color: '#424242',
  },
  '& ul, & ol': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
  '& li': {
    marginBottom: theme.spacing(0.5),
    lineHeight: 1.6,
  },
  '& blockquote': {
    borderLeft: '4px solid #90caf9',
    paddingLeft: theme.spacing(2),
    marginLeft: 0,
    marginRight: 0,
    marginBottom: theme.spacing(2),
    backgroundColor: '#e3f2fd',
    padding: theme.spacing(2),
    borderRadius: '0 8px 8px 0',
    fontStyle: 'italic',
  },
  '& a': {
    color: '#1976d2',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: theme.shape.borderRadius,
    margin: `${theme.spacing(2)} 0`,
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: theme.spacing(2),
    border: '1px solid #e0e0e0',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },
  '& th': {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing(1.5),
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #e0e0e0',
  },
  '& td': {
    padding: theme.spacing(1.5),
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'top',
  },
  '& tr:hover': {
    backgroundColor: '#f9f9f9',
  },
  '& pre': {
    backgroundColor: '#2d2d2d',
    color: '#f8f8f2',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflowX: 'auto',
    marginBottom: theme.spacing(2),
    fontSize: '0.9rem',
  },
  '& code': {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'Monaco, "Courier New", monospace',
    fontSize: '0.9em',
  },
  '& hr': {
    border: 'none',
    borderTop: '1px solid #e0e0e0',
    margin: `${theme.spacing(3)} 0`,
  },
}));

const ToolResponseRenderer: React.FC<ToolResponseRendererProps> = ({ data }) => {
 console.log("Rendering tool response:", data);
  const theme = useTheme();

  if (data.type === 'markdown') {
    return (
      <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
        <MarkdownContainer sx={{ p: 1 }}>
        <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                h1: (props: any) => (
                  <Typography
                    variant="h4"
                    sx={{ mt: 3, mb: 2, fontWeight: 600, color: '#1a237e' }}
                    {...props}
                  />
                ),
                h2: (props: any) => (
                  <Typography
                    variant="h5"
                    sx={{ mt: 2.5, mb: 1.5, fontWeight: 600, color: '#283593' }}
                    {...props}
                  />
                ),
                h3: (props: any) => (
                  <Typography
                    variant="h6"
                    sx={{ mt: 2, mb: 1, fontWeight: 600, color: '#3949ab' }}
                    {...props}
                  />
                ),
                h4: (props: any) => (
                  <Typography
                    sx={{ mt: 2, mb: 1, fontWeight: 600, color: '#5c6bc0', fontSize: '1.25rem' }}
                    {...props}
                  />
                ),
                p: (props: any) => (
                  <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6 }} {...props} />
                ),
                a: (props: any) => (
                  <a style={{ color: '#1976d2', textDecoration: 'none' }} {...props} />
                ),
                blockquote: (props: any) => (
                  <Box
                    sx={{
                      borderLeft: '4px solid #90caf9',
                      pl: 2,
                      ml: 0,
                      mr: 0,
                      mb: 2,
                      backgroundColor: '#e3f2fd',
                      p: 2,
                      borderRadius: '0 8px 8px 0',
                      fontStyle: 'italic',
                    }}
                    {...props}
                  />
                ),
                table: (props: any) => (
                  <Box sx={{ overflowX: 'auto', my: 2 }}>
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                      {...props}
                    />
                  </Box>
                ),
                th: (props: any) => (
                  <th
                    style={{
                        backgroundColor: '#f5f5f5',
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        borderBottom: '2px solid #e0e0e0',
                    }}
                    {...props}
                  />
                ),
                td: (props: any) => (
                  <td
                    style={{
                        padding: '12px',
                        borderBottom: '1px solid #e0e0e0',
                        verticalAlign: 'top',
                    }}
                    {...props}
                    />
                ),
                pre: (props: any) => (
                  <pre
                    style={{
                        backgroundColor: '#2d2d2d',
                        color: '#f8f8f2',
                        padding: '16px',
                        borderRadius: 4,
                        overflowX: 'auto',
                        marginBottom: '16px',
                        fontSize: '0.9rem',
                    }}
                    {...props}
                  />
                ),
                hr: (props: any) => (
                  <hr
                    style={{
                        border: 'none', 
                        borderTop: '1px solid #e0e0e0',
                        margin: '24px 0',
                    }}
                    {...props}
                  />
                ),
            }}
        >   
          {data.content}
        </ReactMarkdown>
        </MarkdownContainer>
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