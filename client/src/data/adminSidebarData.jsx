import ManageBoards from "../pages/academic-hierarchy/ManageBoards";
import ManageClasses from "../pages/academic-hierarchy/ManageClasses";
import ManageSubjects from "../pages/academic-hierarchy/ManageSubjects";
import Requests from "../pages/academic-hierarchy/Requests";
import DifficultyDistribution from "../pages/analytics/DifficultyDistribution";
import ExportLogs from "../pages/analytics/ExportLogs";
import GeneratedSets from "../pages/analytics/GeneratedSets";
import CusRequest from "../pages/customers/CusRequest";
import CustomerList from "../pages/customers/CustomerList";
import CustomerUsage from "../pages/customers/CustomerUsage";
import Dashboard from "../pages/Dashboard";
import BoardAPIs from "../pages/integrations/BoardAPIs";
import ThirdPartyServices from "../pages/integrations/ThirdPartyServices";
import AddQuestion from "../pages/question-bank/AddQuestion";
import AllQuestions from "../pages/question-bank/AllQuestions";
import ImportQuestions from "../pages/question-bank/ImportQuestions";
import QuestionApproval from "../pages/question-bank/QuestionApproval";
import AdminProfile from "../pages/settings/AdminProfile";
import RolesPermissions from "../pages/settings/RolesPermissions";
import SystemConfig from "../pages/settings/SystemConfig";
import ActiveSubscriptions from "../pages/subscription/ActiveSubscriptions";
import BillingSettings from "../pages/subscription/BillingSettings";
import Packages from "../pages/subscription/Packages";
import Transactions from "../pages/subscription/Transactions";
import CustomerTickets from "../pages/support/CustomerTickets";
import KnowledgeBase from "../pages/support/KnowledgeBase";

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
        component:Packages ,
        description: "Create/update/delete plans",
      },
      transactions: {
        title: "Transactions",
        path: "transactions",
        component:Transactions ,
        description: "Payment logs",
      },
      activeSubscriptions: {
        title: "Active Subscriptions",
        path: "active-subscriptions",
        component: ActiveSubscriptions,
        description: "View all active subscriptions",
      },
      billingSettings: {
        title: "Billing Settings",
        path: "billing-settings",
        component: BillingSettings,
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
        component: ManageBoards,
      },
      manageClasses: {
        title: "Manage Classes",
        path: "manage-classes",
        component: ManageClasses,
      },
      manageSubjects: {
        title: "Manage Subjects",
        path: "manage-subjects",
        component: ManageSubjects,
      },
      requests: {
        title: "Requests",
        path: "requests",
        component: Requests,
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
        component: AllQuestions,
      },
      addQuestion: {
        title: "Add Question",
        path: "add-question",
        component: AddQuestion,
      },
      importQuestions: {
        title: "Import Questions",
        path: "import-questions",
        component: ImportQuestions,
        description: "Bulk upload via Excel/CSV",
      },
      questionApproval: {
        title: "Question Approval",
        path: "question-approval",
        component: QuestionApproval,
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
        component: CustomerList,
        description: "Schools, teachers, institutions",
      },
      customerUsage: {
        title: "Customer Usage",
        path: "customer-usage",
        component: CustomerUsage,
        description: "Sets generated, storage used",
      },
      requests: {
        title: "Requests",
        path: "requests",
        component: CusRequest,
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
        component: GeneratedSets,
        description: "By customer, board, class",
      },
      difficultyDistribution: {
        title: "Difficulty Distribution Reports",
        path: "difficulty-distribution",
        component: DifficultyDistribution,
      },
      exportLogs: {
        title: "Export Logs",
        path: "export-logs",
        component: ExportLogs,
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
        component: BoardAPIs,
        description: "CBSE, ICSE, State Boards, etc.",
      },
      thirdPartyServices: {
        title: "3rd Party Services",
        path: "third-party-services",
        component: ThirdPartyServices,
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
        component: AdminProfile,
      },
      rolesPermissions: {
        title: "Roles & Permissions",
        path: "roles-permissions",
        component: RolesPermissions,
        description: "For multiple admin staff",
      },
      systemConfig: {
        title: "System Config",
        path: "system-config",
        component: SystemConfig,
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
        component: CustomerTickets,
      },
      knowledgeBase: {
        title: "Knowledge Base / Help Docs",
        path: "knowledge-base",
        component: KnowledgeBase,
      },
    },
  },
};

export default adminSidebarData;