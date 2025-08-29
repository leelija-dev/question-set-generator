import Dashboard from "../pages/Dashboard";

const adminSidebarData = {
  dashboard: {
    title: "Dashboard",
    path: "dashboard",
    component: Dashboard, // Use the imported Dashboard component
    children: {
      overview: {
        title: "Overview",
        path: "overview",
        component: Dashboard,
        description: "KPIs, usage stats, revenue summary",
      }
    },
  },
  subscriptionBilling: {
    title: "Subscription & Billing",
    path: "subscription-billing",
    component: null,
    children: {
      packages: {
        title: "Packages",
        path: "packages",
        component: null,
        description: "Create/update/delete plans",
      },
      transactions: {
        title: "Transactions",
        path: "transactions",
        component: null,
        description: "Payment logs",
      },
      activeSubscriptions: {
        title: "Active Subscriptions",
        path: "active-subscriptions",
        component: null,
        description: "View all active subscriptions",
      },
      billingSettings: {
        title: "Billing Settings",
        path: "billing-settings",
        component: null,
        description: "Payment gateway configuration",
      },
    },
  },
  academicHierarchy: {
    title: "Academic Hierarchy",
    path: "academic-hierarchy",
    component: null,
    children: {
      manageBoards: {
        title: "Manage Boards",
        path: "manage-boards",
        component: null,
      },
      manageClasses: {
        title: "Manage Classes",
        path: "manage-classes",
        component: null,
      },
      manageSubjects: {
        title: "Manage Subjects",
        path: "manage-subjects",
        component: null,
      },
      requests: {
        title: "Requests",
        path: "requests",
        component: null,
        description: "Approve/reject customer requests",
      },
    },
  },
  questionBank: {
    title: "Question Bank",
    path: "question-bank",
    component: null,
    children: {
      allQuestions: {
        title: "All Questions",
        path: "all-questions",
        component: null,
      },
      addQuestion: {
        title: "Add Question",
        path: "add-question",
        component: null,
      },
      importQuestions: {
        title: "Import Questions",
        path: "import-questions",
        component: null,
        description: "Bulk upload via Excel/CSV",
      },
      questionApproval: {
        title: "Question Approval",
        path: "question-approval",
        component: null,
        description: "Moderation queue if required",
      },
    },
  },
  customers: {
    title: "Customers",
    path: "customers",
    component: null,
    children: {
      customerList: {
        title: "Customer List",
        path: "customer-list",
        component: null,
        description: "Schools, teachers, institutions",
      },
      customerUsage: {
        title: "Customer Usage",
        path: "customer-usage",
        component: null,
        description: "Sets generated, storage used",
      },
      requests: {
        title: "Requests",
        path: "requests",
        component: null,
        description: "Board/class/subject requests",
      },
    },
  },
  questionSetAnalytics: {
    title: "Question Set Analytics",
    path: "question-set-analytics",
    component: null,
    children: {
      generatedSets: {
        title: "Generated Sets",
        path: "generated-sets",
        component: null,
        description: "By customer, board, class",
      },
      difficultyDistribution: {
        title: "Difficulty Distribution Reports",
        path: "difficulty-distribution",
        component: null,
      },
      exportLogs: {
        title: "Export Logs",
        path: "export-logs",
        component: null,
        description: "PDF/Word/Excel usage stats",
      },
    },
  },
  integrations: {
    title: "Integrations",
    path: "integrations",
    component: null,
    children: {
      boardAPIs: {
        title: "Board APIs",
        path: "board-apis",
        component: null,
        description: "CBSE, ICSE, State Boards, etc.",
      },
      thirdPartyServices: {
        title: "3rd Party Services",
        path: "third-party-services",
        component: null,
        description: "AI API, PDF export, etc.",
      },
    },
  },
  settings: {
    title: "Settings",
    path: "settings",
    component: null,
    children: {
      adminProfile: {
        title: "Admin Profile & Security",
        path: "admin-profile",
        component: null,
      },
      rolesPermissions: {
        title: "Roles & Permissions",
        path: "roles-permissions",
        component: null,
        description: "For multiple admin staff",
      },
      systemConfig: {
        title: "System Config",
        path: "system-config",
        component: null,
        description: "Logo, email templates, etc.",
      },
    },
  },
  support: {
    title: "Support",
    path: "support",
    component: null,
    children: {
      customerTickets: {
        title: "Customer Tickets / Requests",
        path: "customer-tickets",
        component: null,
      },
      knowledgeBase: {
        title: "Knowledge Base / Help Docs",
        path: "knowledge-base",
        component: null,
      },
    },
  },
};

export default adminSidebarData;