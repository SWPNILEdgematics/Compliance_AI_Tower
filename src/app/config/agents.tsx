// config/agents.tsx
import React from "react";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material";

export const getAgents = () => {
  const theme = useTheme();
  
  return [
    {
      id: "compliance",
      name: "ComplianceAgent",
      icon: <AssignmentIcon />,
      color: theme.palette.primary.main,
      description: "Run compliance checks and reports",
      agentId: "afdfe741-fc64-4225-a7af-0dc266b76388",
    },
    {
      id: "approvals",
      name: "SummaryAgent",
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      description: "Review and approve requests",
      agentId: "878b09a5-9013-49d5-832c-512b064c5072",
    },
    {
      id: "tower",
      name: "RiskAgent",
      icon: <SecurityIcon />,
      color: theme.palette.warning.main,
      description: "Site overview and red sites",
      agentId: "63584263-6549-4157-9538-57145569827a",
    },
  ];
};

export const agents = [
  {
    id: "compliance",
    name: "ComplianceAgent",
    icon: <AssignmentIcon />,
    color: "#1976d2", // Default primary color
    description: "Run compliance checks and reports",
    agentId: "afdfe741-fc64-4225-a7af-0dc266b76388",
  },
  {
    id: "approvals",
    name: "SummaryAgent",
    icon: <CheckCircleIcon />,
    color: "#2e7d32", // Default success color
    description: "Review and approve requests",
    agentId: "878b09a5-9013-49d5-832c-512b064c5072",
  },
  {
    id: "tower",
    name: "RiskAgent",
    icon: <SecurityIcon />,
    color: "#ed6c02", // Default warning color
    description: "Site overview and red sites",
    agentId: "63584263-6549-4157-9538-57145569827a",
  },
];