const sidebar = document.getElementById("sidebar");
const appShell = document.querySelector(".app-shell");
const menuToggle = document.getElementById("menuToggle");
const sidebarCollapseButton = document.getElementById("sidebarCollapseButton");
const sidebarCollapseIcon = document.getElementById("sidebarCollapseIcon");
const menuItems = [...document.querySelectorAll(".menu-item")];
const projectTrigger = document.getElementById("projectTrigger");
const projectDropdown = document.getElementById("projectDropdown");
const projectOptionList = document.getElementById("projectOptionList");
const editProjectOption = document.getElementById("editProjectOption");
const addProjectOption = document.getElementById("addProjectOption");
const activeProjectMark = document.getElementById("activeProjectMark");
const activeProjectName = document.getElementById("activeProjectName");
const activeProjectCode = document.getElementById("activeProjectCode");
const workspaceEyebrow = document.getElementById("workspaceEyebrow");
const workspaceTitle = document.getElementById("workspaceTitle");
const workspaceCopy = document.getElementById("workspaceCopy");
const workspaceBody = document.getElementById("workspaceBody");
const workspacePanel = document.getElementById("workspacePanel");
const deliverableModal = document.getElementById("deliverableModal");
const confirmationModal = document.getElementById("confirmationModal");
const confirmationDialogEyebrow = confirmationModal.querySelector(".confirmation-dialog-eyebrow");
const confirmationDialogTitle = document.getElementById("confirmationDialogTitle");
const confirmationDialogMessage = document.getElementById("confirmationDialogMessage");
const confirmationDialogSubjectLabel = confirmationModal.querySelector(
  ".confirmation-dialog-subject-label",
);
const confirmationDialogSubject = document.getElementById("confirmationDialogSubject");
const confirmationDialogCancel = document.getElementById("confirmationDialogCancel");
const confirmationDialogConfirm = document.getElementById("confirmationDialogConfirm");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeValue = (value = "") => value.trim().toLowerCase();

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const ACTION_ICON_MARKUP = Object.freeze({
  edit: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.74 2.26a1.5 1.5 0 1 1 2.12 2.12l-6.9 6.9-2.82.71.7-2.82z"></path>
      <path d="m9.68 3.32 3 3"></path>
    </svg>
  `,
  close: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8"></path>
      <path d="M12 4 4 12"></path>
    </svg>
  `,
  delete: `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4.5h11"></path>
      <path d="M6 4.5V3.4c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v1.1"></path>
      <path d="m4.9 4.5.6 7.2c0 .7.6 1.3 1.3 1.3h2.4c.7 0 1.3-.6 1.3-1.3l.6-7.2"></path>
      <path d="M6.9 6.9v3.2"></path>
      <path d="M9.1 6.9v3.2"></path>
    </svg>
  `,
});

const renderActionIconButton = ({
  action,
  icon,
  label,
  tone = "default",
  unframed = false,
  dataAttributes = {},
}) => {
  const classes = ["definition-action", "definition-action-icon"];

  if (tone === "danger") {
    classes.push("definition-action-danger");
  }

  if (unframed) {
    classes.push("definition-action-icon-plain");
  }

  const dataAttributeMarkup = Object.entries(dataAttributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `data-${key}="${escapeHtml(String(value))}"`)
    .join(" ");

  return `
    <button
      class="${classes.join(" ")}"
      type="button"
      data-action="${escapeHtml(action)}"
      aria-label="${escapeHtml(label)}"
      title="${escapeHtml(label)}"
      ${dataAttributeMarkup}
    >
      <span class="definition-action-icon-mark" aria-hidden="true">
        ${ACTION_ICON_MARKUP[icon] ?? ""}
      </span>
    </button>
  `;
};

const createProjectFromOption = (option) => ({
  id: option.dataset.projectId,
  name: option.dataset.projectName,
  code: option.dataset.projectCode ?? "",
  defaultPhaseId: option.dataset.projectDefaultPhaseId ?? "",
  archived: option.dataset.projectArchived === "true",
});

const PROJECT_SCOPED_COLLECTION_KEYS = Object.freeze([
  "deliverables",
  "types",
  "phases",
  "wbs",
  "packages",
  "roles",
  "members",
  "ruleSets",
]);

const createProjectState = () =>
  Object.fromEntries(PROJECT_SCOPED_COLLECTION_KEYS.map((key) => [key, []]));

const createProjectScopedEntity = (projectId, payload) => ({
  id: crypto.randomUUID(),
  projectId,
  ...payload,
});

const createNamedProjectEntities = (projectId, names) =>
  names.map((name) => createProjectScopedEntity(projectId, { name }));

const normalizeProjectScopedCollection = (projectId, collection = []) => {
  collection.forEach((item) => {
    if (item && typeof item === "object") {
      item.projectId = projectId;
    }
  });

  return collection;
};

const APP_STORAGE_KEY = "delivera.app-state.v1";

const normalizePersistedProject = (project) => {
  if (!project || typeof project !== "object") {
    return null;
  }

  const id = typeof project.id === "string" ? project.id.trim() : "";
  const name = typeof project.name === "string" ? project.name.trim() : "";

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    code: typeof project.code === "string" ? project.code : "",
    defaultPhaseId: typeof project.defaultPhaseId === "string" ? project.defaultPhaseId : "",
    archived: Boolean(project.archived),
  };
};

const normalizePersistedProjectState = (projectId, projectState) => {
  const normalizedState = createProjectState();

  if (!projectState || typeof projectState !== "object") {
    return normalizedState;
  }

  PROJECT_SCOPED_COLLECTION_KEYS.forEach((key) => {
    normalizedState[key] = normalizeProjectScopedCollection(
      projectId,
      Array.isArray(projectState[key]) ? projectState[key] : [],
    );
  });

  return normalizedState;
};

const getPersistedAppState = () => {
  try {
    const rawState = window.localStorage.getItem(APP_STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState);
    const projects = Array.isArray(parsedState?.projects)
      ? parsedState.projects.map(normalizePersistedProject).filter(Boolean)
      : [];

    if (!projects.length) {
      return null;
    }

    const projectStateStore = Object.fromEntries(
      projects.map((project) => [
        project.id,
        normalizePersistedProjectState(project.id, parsedState?.projectStateStore?.[project.id]),
      ]),
    );
    const currentProjectId =
      typeof parsedState?.currentProjectId === "string" ? parsedState.currentProjectId : null;

    return {
      projects,
      projectStateStore,
      currentProjectId,
    };
  } catch (error) {
    console.warn("Could not load persisted Delivera state.", error);
    return null;
  }
};

const createInitialAppState = () => {
  const persistedState = getPersistedAppState();

  if (persistedState) {
    return persistedState;
  }

  const projects = [...projectOptionList.querySelectorAll("[data-project-id]")].map((option) =>
    createProjectFromOption(option),
  );

  return {
    projects,
    projectStateStore: Object.fromEntries(
      projects.map((project) => [project.id, createProjectState()]),
    ),
    currentProjectId: projects[0]?.id ?? null,
  };
};

const createEmptyStage = () => ({
  name: "",
});

const createEmptyTypeAllocation = () => ({
  roleId: "",
});

const createDeliverableStageRecord = (stage, index) => ({
  id: crypto.randomUUID(),
  templateStageId: stage.id ?? null,
  stageName: stage.name,
  order: index,
  status: index === 0 ? "active" : "pending",
  expectedDate: null,
  completedDate: null,
});

const createDeliverableStagesFromRuleSet = (ruleSet) =>
  ruleSet?.stages?.map((stage, index) => createDeliverableStageRecord(stage, index)) ?? [];

const createDeliverablesTableFilters = (project = null) => ({
  code: "",
  typeId: "",
  assignments: "",
  ruleSetId: "",
  phaseId: getProjectDefaultPhaseId(project),
  wbsId: "",
  packageId: "",
});

const createDeliverablesTableState = (project = null) => ({
  sortBy: "code",
  sortDirection: "asc",
  filters: createDeliverablesTableFilters(project),
});

const initialAppState = createInitialAppState();

let projects = initialAppState.projects;

const projectStateStore = initialAppState.projectStateStore;

const definitionConfigs = {
  types: {
    singular: "deliverable type",
    plural: "deliverable types",
    createLabel: "Add type",
    editLabel: "Save type",
    inlineEdit: true,
    listTitle: "Defined types",
    emptyMessage: (project) => `No deliverable types yet for ${project.name}.`,
    getDisplayName: (item) => item.name,
    fields: [
      {
        key: "name",
        label: "Type name",
        placeholder: "Engineering drawings",
        required: true,
      },
    ],
    renderSummary: (item) => `<strong>${escapeHtml(item.name)}</strong>`,
    validate(values, { projectId, excludingId }) {
      if (!values.name) {
        return {
          field: "name",
          message: "Type name is required.",
        };
      }

      if (hasDuplicateDefinitionField("types", projectId, "name", values.name, excludingId)) {
        return {
          field: "name",
          message: "A deliverable type with this name already exists in the selected project.",
        };
      }

      return {
        payload: {
          name: values.name,
        },
      };
    },
  },
  phases: {
    singular: "project phase",
    plural: "project phases",
    createLabel: "Add phase",
    editLabel: "Save phase",
    inlineEdit: true,
    inlineCreate: true,
    textEditTrigger: true,
    listTitle: "Defined phases",
    emptyMessage: (project) => `No project phases yet for ${project.name}.`,
    getDisplayName: (item) => item.name,
    fields: [
      {
        key: "name",
        label: "Phase name",
        placeholder: "Detailed engineering",
        required: true,
      },
    ],
    renderSummary: (item) => `<strong>${escapeHtml(item.name)}</strong>`,
    validate(values, { projectId, excludingId }) {
      if (!values.name) {
        return {
          field: "name",
          message: "Phase name is required.",
        };
      }

      if (hasDuplicateDefinitionField("phases", projectId, "name", values.name, excludingId)) {
        return {
          field: "name",
          message: "A phase with this name already exists in the selected project.",
        };
      }

      return {
        payload: {
          name: values.name,
        },
      };
    },
  },
  wbs: {
    singular: "WBS item",
    plural: "WBS items",
    createLabel: "Add WBS item",
    editLabel: "Save WBS item",
    inlineEdit: true,
    inlineCreate: true,
    textEditTrigger: true,
    inlineGridColumns: "minmax(120px, 0.38fr) minmax(0, 1fr)",
    listTitle: "Defined WBS items",
    emptyMessage: (project) => `No WBS items yet for ${project.name}.`,
    getDisplayName: (item) => `${item.code} · ${item.name}`,
    fields: [
      {
        key: "code",
        label: "WBS code",
        placeholder: "3100",
        required: true,
      },
      {
        key: "name",
        label: "WBS name",
        placeholder: "Structural steel",
        required: true,
      },
    ],
    renderSummary: (item) => `
      <div class="definition-copy-stack">
        <strong>${escapeHtml(item.code)}</strong>
        <span>${escapeHtml(item.name)}</span>
      </div>
    `,
    validate(values, { projectId, excludingId }) {
      if (!values.code) {
        return {
          field: "code",
          message: "WBS code is required.",
        };
      }

      if (!values.name) {
        return {
          field: "name",
          message: "WBS name is required.",
        };
      }

      if (hasDuplicateDefinitionField("wbs", projectId, "code", values.code, excludingId)) {
        return {
          field: "code",
          message: "A WBS item with this code already exists in the selected project.",
        };
      }

      return {
        payload: {
          code: values.code,
          name: values.name,
        },
      };
    },
  },
  packages: {
    singular: "construction package",
    plural: "construction packages",
    createLabel: "Add package",
    editLabel: "Save package",
    inlineEdit: true,
    inlineCreate: true,
    textEditTrigger: true,
    inlineGridColumns: "minmax(120px, 0.38fr) minmax(0, 1fr)",
    listTitle: "Defined packages",
    emptyMessage: (project) => `No construction packages yet for ${project.name}.`,
    getDisplayName: (item) => (item.name ? `${item.code} · ${item.name}` : item.code),
    fields: [
      {
        key: "code",
        label: "Package code",
        placeholder: "PKG-A1",
        required: true,
      },
      {
        key: "name",
        label: "Package name",
        placeholder: "Crusher gallery",
        required: false,
      },
    ],
    renderSummary: (item) => `
      <div class="definition-copy-stack">
        <strong>${escapeHtml(item.code)}</strong>
        <span>${escapeHtml(item.name || "No package name")}</span>
      </div>
    `,
    validate(values, { projectId, excludingId }) {
      if (!values.code) {
        return {
          field: "code",
          message: "Package code is required.",
        };
      }

      if (hasDuplicateDefinitionField("packages", projectId, "code", values.code, excludingId)) {
        return {
          field: "code",
          message: "A package with this code already exists in the selected project.",
        };
      }

      return {
        payload: {
          code: values.code,
          name: values.name,
        },
      };
    },
  },
  roles: {
    singular: "role",
    plural: "roles",
    createLabel: "Add role",
    editLabel: "Save role",
    inlineEdit: true,
    inlineCreate: true,
    textEditTrigger: true,
    listTitle: "Defined roles",
    emptyMessage: (project) => `No roles yet for ${project.name}.`,
    getDisplayName: (item) => item.name,
    fields: [
      {
        key: "name",
        label: "Role name",
        placeholder: "Project manager",
        required: true,
      },
    ],
    renderSummary: (item) => `<strong>${escapeHtml(item.name)}</strong>`,
    validate(values, { projectId, excludingId }) {
      if (!values.name) {
        return {
          field: "name",
          message: "Role name is required.",
        };
      }

      if (hasDuplicateDefinitionField("roles", projectId, "name", values.name, excludingId)) {
        return {
          field: "name",
          message: "A role with this name already exists in the selected project.",
        };
      }

      return {
        payload: {
          name: values.name,
        },
      };
    },
  },
  members: {
    singular: "member",
    plural: "members",
    createLabel: "Add member",
    editLabel: "Save member",
    inlineEdit: true,
    inlineCreate: true,
    textEditTrigger: true,
    listTitle: "Defined members",
    emptyMessage: (project) => `No members yet for ${project.name}.`,
    getDisplayName: (item) => item.name,
    fields: [
      {
        key: "name",
        label: "Member name",
        placeholder: "John Doe",
        required: true,
      },
    ],
    renderSummary: (item) => `
      <div class="definition-copy-stack">
        <strong>${escapeHtml(item.name)}</strong>
      </div>
    `,
    validate(values) {
      if (!values.name) {
        return {
          field: "name",
          message: "Member name is required.",
        };
      }

      return {
        payload: {
          name: values.name,
        },
      };
    },
  },
};

let currentProject =
  projects.find((project) => project.id === initialAppState.currentProjectId) ??
  projects[0] ??
  null;
let currentView = "deliverables";
let projectEditorProjectId = null;
let pendingConfirmationAction = null;
let confirmationReturnFocus = null;
let deliverableModalReturnFocus = null;
let isDesktopSidebarCollapsed = false;
let deliverablesTableState = createDeliverablesTableState(currentProject);
let editingDefinition = {
  view: null,
  itemId: null,
};
let editingDeliverableTypeId = null;
let editingRuleSetId = null;
let selectedDeliverableId = null;

const getProjectState = (projectId) => {
  if (!projectId) {
    return createProjectState();
  }

  if (!projectStateStore[projectId]) {
    projectStateStore[projectId] = createProjectState();
  }

  const projectState = projectStateStore[projectId];

  PROJECT_SCOPED_COLLECTION_KEYS.forEach((key) => {
    projectState[key] = normalizeProjectScopedCollection(projectId, projectState[key]);
  });

  return projectState;
};

const persistAppState = () => {
  try {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        projects,
        projectStateStore: Object.fromEntries(
          projects.map((project) => [project.id, getProjectState(project.id)]),
        ),
        currentProjectId: currentProject?.id ?? null,
      }),
    );
  } catch (error) {
    console.warn("Could not persist Delivera state.", error);
  }
};

const getDefinitionItems = (view, projectId) => getProjectState(projectId)[view];

const getRuleSets = (projectId) => getProjectState(projectId).ruleSets;

const getDeliverables = (projectId) => getProjectState(projectId).deliverables;

const getDeliverableById = (projectId, deliverableId) =>
  getDeliverables(projectId).find((deliverable) => deliverable.id === deliverableId) ?? null;

const getSelectedDeliverable = (projectId = currentProject?.id ?? "") =>
  selectedDeliverableId ? getDeliverableById(projectId, selectedDeliverableId) : null;

const getRoles = (projectId) => getProjectState(projectId).roles;

const getMembers = (projectId) => getProjectState(projectId).members;

const findRole = (projectId, roleId) => getRoles(projectId).find((item) => item.id === roleId);

const findMember = (projectId, memberId) =>
  getMembers(projectId).find((item) => item.id === memberId);

const findDefinitionItem = (view, projectId, itemId) =>
  getDefinitionItems(view, projectId).find((item) => item.id === itemId);

const findRuleSet = (projectId, ruleSetId) =>
  getRuleSets(projectId).find((item) => item.id === ruleSetId);

function getProjectDefaultPhaseId(project) {
  return project?.defaultPhaseId && findDefinitionItem("phases", project.id, project.defaultPhaseId)
    ? project.defaultPhaseId
    : "";
}

const getDefinitionDisplayName = (view, projectId, itemId) => {
  const config = definitionConfigs[view];
  const item = findDefinitionItem(view, projectId, itemId);

  if (!config || !item) {
    return "Unknown";
  }

  return config.getDisplayName(item, { projectId });
};

const getRuleSetDisplayName = (projectId, ruleSetId) =>
  findRuleSet(projectId, ruleSetId)?.name ?? "Unknown";

const getRoleOptions = (projectId) =>
  getRoles(projectId).map((role) => ({
    value: role.id,
    label: role.name,
  }));

const getMemberOptions = (projectId) =>
  getMembers(projectId).map((member) => ({
    value: member.id,
    label: member.name,
  }));

const getRoleDisplayName = (projectId, roleId) => findRole(projectId, roleId)?.name ?? "Unknown role";

const getDefinitionOptions = (view, projectId) =>
  getDefinitionItems(view, projectId).map((item) => ({
    value: item.id,
    label: getDefinitionDisplayName(view, projectId, item.id),
  }));

const getRuleSetOptions = (projectId) =>
  getRuleSets(projectId).map((ruleSet) => ({
    value: ruleSet.id,
    label: ruleSet.name,
  }));

const getDeliverablesUsingDefinition = (projectId, field, itemId) =>
  getDeliverables(projectId).filter((deliverable) => deliverable[field] === itemId);

const getDeliverablesUsingRuleSet = (projectId, ruleSetId) =>
  getDeliverables(projectId).filter((deliverable) => deliverable.ruleSetId === ruleSetId);

const getDeliverableTypesUsingRole = (projectId, roleId) =>
  getDefinitionItems("types", projectId).filter((deliverableType) =>
    (deliverableType.allocations ?? []).some((allocation) => allocation.roleId === roleId),
  );

const getDeliverableTypesUsingRuleSet = (projectId, ruleSetId) =>
  getDefinitionItems("types", projectId).filter(
    (deliverableType) => (deliverableType.ruleSetId ?? "") === ruleSetId,
  );

const normalizeDeliverableStageStatus = (status = "pending") =>
  status === "blocked" ? "active" : status;

const getDeliverableStages = (deliverable, projectId) => {
  if (!Array.isArray(deliverable.stages)) {
    deliverable.stages = createDeliverableStagesFromRuleSet(findRuleSet(projectId, deliverable.ruleSetId));
  }

  deliverable.stages.forEach((stage, index) => {
    stage.order = stage.order ?? index;
    stage.status = normalizeDeliverableStageStatus(stage.status);
  });

  return deliverable.stages;
};

const getDeliverableAssignmentSelectionMap = (deliverable = null) =>
  new Map(
    (deliverable?.assignments ?? []).map((assignment) => [
      assignment.roleId ?? "",
      assignment.memberId ?? "",
    ]),
  );

const getDeliverableTypeAssignmentTemplates = (projectId, typeId) => {
  const deliverableType = findDefinitionItem("types", projectId, typeId);

  if (!deliverableType) {
    return [];
  }

  return getDeliverableTypeAllocations(deliverableType)
    .map((allocation, index) => {
      const role = findRole(projectId, allocation.roleId);

      if (!role) {
        return null;
      }

      return {
        order: index,
        roleId: role.id,
        roleName: role.name,
      };
    })
    .filter(Boolean);
};

const getDeliverableTypeRuleSetId = (deliverableType) => deliverableType?.ruleSetId ?? "";

const getDeliverableTypeRuleSet = (projectId, deliverableType) =>
  findRuleSet(projectId, getDeliverableTypeRuleSetId(deliverableType));

const hasDuplicateDefinitionField = (view, projectId, field, value, excludingId = null) =>
  getDefinitionItems(view, projectId).some(
    (item) =>
      item.id !== excludingId && normalizeValue(item[field] ?? "") === normalizeValue(value),
  );

const hasDuplicateRuleSet = (projectId, value, excludingId = null) =>
  getRuleSets(projectId).some(
    (item) => item.id !== excludingId && normalizeValue(item.name) === normalizeValue(value),
  );

const findProjectById = (projectId) => projects.find((project) => project.id === projectId) ?? null;

const resetDeliverablesTableState = (project = currentProject) => {
  deliverablesTableState = createDeliverablesTableState(project);
};

const formatLabelList = (labels) => {
  if (labels.length <= 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
};

const formatDefinitionLabel = (label = "") =>
  label.replace(/\b[a-z]/g, (character) => character.toUpperCase());

const resetDefinitionEditingState = () => {
  editingDefinition = {
    view: null,
    itemId: null,
  };
  editingDeliverableTypeId = null;
  editingRuleSetId = null;
};

const closeProjectEditor = () => {
  projectEditorProjectId = null;
};

const openProjectEditor = (projectId = null) => {
  projectEditorProjectId = projectId;
  currentView = "project-editor";
  resetDefinitionEditingState();
  setActiveMenu("");
  renderView();
  closeProjectDropdown();
  closeSidebarOnMobile();
};

const syncBodyModalState = () => {
  document.body.classList.toggle(
    "has-modal-open",
    !confirmationModal.hidden || !deliverableModal.hidden,
  );
};

const isDeliverableModalOpen = () => !deliverableModal.hidden;

const closeDeliverableModal = ({ restoreFocus = true } = {}) => {
  if (!isDeliverableModalOpen()) {
    deliverableModalReturnFocus = null;
    return;
  }

  deliverableModal.hidden = true;
  deliverableModal.innerHTML = "";
  syncBodyModalState();

  const nextFocusTarget = deliverableModalReturnFocus;
  deliverableModalReturnFocus = null;

  if (
    restoreFocus &&
    nextFocusTarget instanceof HTMLElement &&
    document.contains(nextFocusTarget)
  ) {
    nextFocusTarget.focus();
  }
};

const openDeliverableModal = () => {
  if (!currentProject) {
    openProjectEditor();
    return;
  }

  if (showMissingDeliverableRequirementsFeedback(currentProject.id)) {
    return;
  }

  deliverableModalReturnFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  deliverableModal.innerHTML = renderDeliverableModalContent(currentProject);
  deliverableModal.hidden = false;
  syncBodyModalState();
  closeProjectDropdown();
  closeSidebarOnMobile();
  bindDeliverableModal();

  requestAnimationFrame(() => {
    focusFirstField("#deliverableModal [data-deliverable-field=\"code\"]");
  });
};

const isConfirmationModalOpen = () => !confirmationModal.hidden;

const closeConfirmationModal = ({ restoreFocus = true } = {}) => {
  if (!isConfirmationModalOpen()) {
    pendingConfirmationAction = null;
    confirmationReturnFocus = null;
    return;
  }

  confirmationModal.hidden = true;
  syncBodyModalState();

  const nextFocusTarget = confirmationReturnFocus;
  pendingConfirmationAction = null;
  confirmationReturnFocus = null;

  if (
    restoreFocus &&
    nextFocusTarget instanceof HTMLElement &&
    document.contains(nextFocusTarget)
  ) {
    nextFocusTarget.focus();
  }
};

const setConfirmationConfirmVariant = (variant = "danger") => {
  confirmationDialogConfirm.classList.toggle("definition-action-danger-fill", variant === "danger");
  confirmationDialogConfirm.classList.toggle("definition-action-primary", variant === "primary");
};

const openConfirmationModal = ({
  eyebrow = "Confirm deletion",
  title,
  message,
  subjectLabel = "Selected item",
  subject,
  confirmLabel = "Delete",
  confirmVariant = "danger",
  cancelHidden = false,
  onConfirm,
}) => {
  pendingConfirmationAction = onConfirm;
  confirmationReturnFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (confirmationDialogEyebrow) {
    confirmationDialogEyebrow.textContent = eyebrow;
  }

  confirmationDialogTitle.textContent = title;
  confirmationDialogMessage.textContent = message;
  if (confirmationDialogSubjectLabel) {
    confirmationDialogSubjectLabel.textContent = subjectLabel;
  }
  confirmationDialogSubject.textContent = subject;
  confirmationDialogConfirm.textContent = confirmLabel;
  confirmationDialogCancel.hidden = cancelHidden;
  setConfirmationConfirmVariant(confirmVariant);
  confirmationModal.hidden = false;
  syncBodyModalState();
  closeProjectDropdown();
  closeSidebarOnMobile();

  requestAnimationFrame(() => {
    (cancelHidden ? confirmationDialogConfirm : confirmationDialogCancel).focus();
  });
};

const deleteDefinitionItem = (view, itemId) => {
  getProjectState(currentProject.id)[view] = getDefinitionItems(view, currentProject.id).filter(
    (item) => item.id !== itemId,
  );

  if (view === "phases" && currentProject.defaultPhaseId === itemId) {
    currentProject.defaultPhaseId = "";
  }

  if (view === "phases" && deliverablesTableState.filters.phaseId === itemId) {
    deliverablesTableState.filters.phaseId = getProjectDefaultPhaseId(currentProject);
  }

  if (view === "types" && editingDeliverableTypeId === itemId) {
    editingDeliverableTypeId = null;
  }

  if (editingDefinition.view === view && editingDefinition.itemId === itemId) {
    editingDefinition = {
      view: null,
      itemId: null,
    };
  }

  renderView();
};

const requestDefinitionDeletion = (view, itemId) => {
  const config = definitionConfigs[view];
  const item = findDefinitionItem(view, currentProject.id, itemId);

  if (!config || !item) {
    return;
  }

  if (view === "roles") {
    const dependentDeliverableTypes = getDeliverableTypesUsingRole(currentProject.id, itemId);

    if (dependentDeliverableTypes.length) {
      openConfirmationModal({
        title: "Cannot delete role",
        message: `Remove or update ${pluralize(dependentDeliverableTypes.length, "deliverable type")} before deleting this role from ${currentProject.name}.`,
        subject: item.name,
        confirmLabel: "Close",
        confirmVariant: "primary",
        cancelHidden: true,
        onConfirm: () => {},
      });
      return;
    }
  }

  const deliverableReferenceFieldMap = {
    types: "typeId",
    phases: "phaseId",
    wbs: "wbsId",
    packages: "packageId",
  };
  const deliverableReferenceField = deliverableReferenceFieldMap[view];

  if (deliverableReferenceField) {
    const dependentDeliverables = getDeliverablesUsingDefinition(
      currentProject.id,
      deliverableReferenceField,
      itemId,
    );

    if (dependentDeliverables.length) {
      openConfirmationModal({
        title: `Cannot delete ${config.singular}`,
        message: `Remove or update ${pluralize(dependentDeliverables.length, "deliverable")} before deleting this ${config.singular} from ${currentProject.name}.`,
        subject: config.getDisplayName(item, { projectId: currentProject.id }),
        confirmLabel: "Close",
        confirmVariant: "primary",
        cancelHidden: true,
        onConfirm: () => {},
      });
      return;
    }
  }

  openConfirmationModal({
    title: `Delete ${config.singular}?`,
    message: `This will remove it from ${currentProject.name}. This action cannot be undone in this prototype.`,
    subject: config.getDisplayName(item, { projectId: currentProject.id }),
    onConfirm: () => {
      deleteDefinitionItem(view, itemId);
    },
  });
};

const deleteRuleSet = (ruleSetId) => {
  getProjectState(currentProject.id).ruleSets = getRuleSets(currentProject.id).filter(
    (item) => item.id !== ruleSetId,
  );

  if (editingRuleSetId === ruleSetId) {
    editingRuleSetId = null;
  }

  renderView();
};

const requestRuleSetDeletion = (ruleSetId) => {
  const ruleSet = findRuleSet(currentProject.id, ruleSetId);

  if (!ruleSet) {
    return;
  }

  const dependentDeliverables = getDeliverablesUsingRuleSet(currentProject.id, ruleSetId);
  const dependentDeliverableTypes = getDeliverableTypesUsingRuleSet(currentProject.id, ruleSetId);

  if (dependentDeliverables.length || dependentDeliverableTypes.length) {
    const dependencies = [
      dependentDeliverableTypes.length
        ? pluralize(dependentDeliverableTypes.length, "deliverable type")
        : "",
      dependentDeliverables.length ? pluralize(dependentDeliverables.length, "deliverable") : "",
    ].filter(Boolean);

    openConfirmationModal({
      title: "Cannot delete lifecycle stage set",
      message: `Remove or update ${formatLabelList(dependencies)} before deleting this lifecycle stage set from ${currentProject.name}.`,
      subject: ruleSet.name,
      confirmLabel: "Close",
      confirmVariant: "primary",
      cancelHidden: true,
      onConfirm: () => {},
    });
    return;
  }

  openConfirmationModal({
    title: "Delete lifecycle stage set?",
    message: `This will remove the lifecycle stage set and all of its stages from ${currentProject.name}. This action cannot be undone in this prototype.`,
    subject: ruleSet.name,
    onConfirm: () => {
      deleteRuleSet(ruleSetId);
    },
  });
};

const deleteDeliverable = (deliverableId) => {
  getProjectState(currentProject.id).deliverables = getDeliverables(currentProject.id).filter(
    (item) => item.id !== deliverableId,
  );

  closeDeliverableEditor();
};

const requestDeliverableDeletion = (deliverableId) => {
  const deliverable = getDeliverableById(currentProject.id, deliverableId);

  if (!deliverable) {
    return;
  }

  openConfirmationModal({
    title: "Delete deliverable?",
    message: `This will permanently remove the deliverable from ${currentProject.name}. This action cannot be undone.`,
    subject: deliverable.code,
    onConfirm: () => {
      deleteDeliverable(deliverableId);
    },
  });
};

const deleteProject = (projectId) => {
  projects = projects.filter((entry) => entry.id !== projectId);
  delete projectStateStore[projectId];
  currentProject = projects[0] ?? null;
  resetDeliverablesTableState();
  currentView = "deliverables";
  closeProjectEditor();
  resetDefinitionEditingState();
  renderProjectOptions();
  syncProjectSelection();
  setActiveMenu(currentView);
  renderView();
  closeProjectDropdown();
  closeSidebarOnMobile();
};

const requestProjectDeletion = (projectId) => {
  const project = findProjectById(projectId);

  if (!project || projects.length <= 1) {
    return;
  }

  openConfirmationModal({
    title: "Delete project?",
    message:
      "This will remove the project and all of its project-scoped definitions and deliverables from this prototype.",
    subject: project.code ? `${project.name} (${project.code})` : project.name,
    onConfirm: () => {
      deleteProject(projectId);
    },
  });
};

const showFieldError = (field, message) => {
  if (!field) return;

  field.setCustomValidity(message);
  field.reportValidity();
  field.focus();
};

const getProjectMetaLabel = (project) => {
  const codeLabel = project?.code || "No code";
  return project?.archived ? `${codeLabel} · Archived` : codeLabel;
};

const getProjectInitials = (project) => {
  const codeLetters = (project.code ?? "").replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();

  if (codeLetters.length >= 2) {
    return codeLetters;
  }

  const nameInitials = (project.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return nameInitials || "PR";
};

const renderProjectOptions = () => {
  projectOptionList.innerHTML = projects
    .map(
      (project) => `
        <button
          class="project-option${project.id === currentProject?.id ? " is-selected" : ""}"
          type="button"
          data-project-id="${escapeHtml(project.id)}"
          data-project-name="${escapeHtml(project.name)}"
          data-project-code="${escapeHtml(project.code)}"
          data-project-default-phase-id="${escapeHtml(project.defaultPhaseId ?? "")}"
          data-project-archived="${project.archived ? "true" : "false"}"
        >
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(getProjectMetaLabel(project))}</span>
        </button>
      `,
    )
    .join("");
};

const renderNoProjectsBody = () => `
  <section class="definition-stack">
    <section class="definition-list-shell">
      <div class="definition-list-head">
        <p class="definition-list-title">No projects</p>
        <span class="definition-list-count">0</span>
      </div>
      <div class="definition-empty">
        Create a project to start adding deliverables, lifecycle stages, and project definitions.
      </div>
      <div class="type-form-actions">
        <button class="primary-button" type="button" data-action="open-project-editor-empty">
          Create project
        </button>
      </div>
    </section>
  </section>
`;

const getDefinitionFieldOptions = (field, projectId) => {
  if (typeof field.options === "function") {
    return field.options({ projectId });
  }

  return field.options ?? [];
};

const getDefinitionFieldPlaceholder = (field, projectId) => {
  if (typeof field.placeholderOption === "function") {
    return field.placeholderOption({ projectId });
  }

  return field.placeholderOption ?? null;
};

const isDefinitionFieldDisabled = (field, projectId) => {
  if (typeof field.isDisabled === "function") {
    return field.isDisabled({ projectId });
  }

  return Boolean(field.disabled);
};

const renderDefinitionField = (field, value = "", { projectId } = {}) => {
  const escapedValue = escapeHtml(value);
  const requiredAttribute = field.required ? "required" : "";
  const placeholderAttribute = field.placeholder
    ? `placeholder="${escapeHtml(field.placeholder)}"`
    : "";
  const disabledAttribute = isDefinitionFieldDisabled(field, projectId) ? "disabled" : "";
  const rows = field.rows ?? 3;
  const options = field.type === "select" ? getDefinitionFieldOptions(field, projectId) : [];
  const placeholderOption =
    field.type === "select" ? getDefinitionFieldPlaceholder(field, projectId) : null;

  return `
    <label class="field${field.fullWidth ? " field-full" : ""}">
      <span>${escapeHtml(field.label)}</span>
      ${
        field.type === "textarea"
          ? `
            <textarea
              data-definition-field="${field.key}"
              ${placeholderAttribute}
              rows="${rows}"
              ${requiredAttribute}
              ${disabledAttribute}
            >${escapedValue}</textarea>
          `
          : field.type === "select"
            ? `
              <select
                data-definition-field="${field.key}"
                ${requiredAttribute}
                ${disabledAttribute}
              >
                ${
                  placeholderOption
                    ? `
                      <option value="" ${value ? "" : "selected"}>
                        ${escapeHtml(placeholderOption)}
                      </option>
                    `
                    : ""
                }
                ${options
                  .map(
                    (option) => `
                      <option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>
                        ${escapeHtml(option.label)}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            `
          : `
            <input
              data-definition-field="${field.key}"
              type="${field.type ?? "text"}"
              value="${escapedValue}"
              ${placeholderAttribute}
              autocomplete="off"
              ${requiredAttribute}
              ${disabledAttribute}
            />
          `
      }
    </label>
  `;
};

const renderDefinitionForm = (view, item = null, projectId = currentProject?.id ?? "") => {
  const config = definitionConfigs[view];
  const values = item ?? {};
  const isEditing = Boolean(item);
  const gridClass = config.fields.length === 1 ? " definition-form-grid-single" : "";
  const gridStyle =
    config.inlineGridColumns && config.fields.length > 1
      ? ` style="grid-template-columns: ${escapeHtml(config.inlineGridColumns)};"`
      : "";
  const formClasses = [
    "definition-form",
    config.inlineCreate && !isEditing ? "definition-form-inline-create" : "",
    config.inlineCreate && !isEditing && config.fields.length > 1
      ? "definition-form-inline-create-wide"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <form
      class="${formClasses}"
      id="definitionForm"
      data-definition-view="${view}"
      ${isEditing ? `data-item-id="${item.id}"` : ""}
    >
      <div class="definition-form-grid${gridClass}"${gridStyle}>
        ${config.fields
          .map((field) => renderDefinitionField(field, values[field.key] ?? "", { projectId }))
          .join("")}
      </div>
      <div class="definition-form-actions">
        <button class="primary-button" type="submit">
          ${isEditing ? config.editLabel : config.createLabel}
        </button>
        ${
          isEditing
            ? `
              <button class="definition-action" type="button" data-action="cancel-definition-edit">
                Cancel
              </button>
            `
            : ""
        }
      </div>
    </form>
  `;
};

const renderDefinitionInlineEditForm = (view, item, index, projectId = currentProject?.id ?? "") => {
  const config = definitionConfigs[view];
  const gridClass = config.fields.length === 1 ? " definition-inline-grid-single" : "";
  const gridStyle =
    config.inlineGridColumns && config.fields.length > 1
      ? ` style="grid-template-columns: ${escapeHtml(config.inlineGridColumns)};"`
      : "";

  return `
    <li>
      <form
        class="definition-row definition-row-editing definition-row-inline-edit"
        id="definitionInlineEditForm"
        data-definition-view="${view}"
        data-item-id="${item.id}"
      >
        <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="definition-inline-grid${gridClass}"${gridStyle}>
          ${config.fields
            .map((field) => renderDefinitionField(field, item[field.key] ?? "", { projectId }))
            .join("")}
        </div>
      </form>
    </li>
  `;
};

const renderDefinitionBody = (view, project) => {
  const config = definitionConfigs[view];
  const items = getDefinitionItems(view, project.id);
  const editingItem =
    editingDefinition.view === view && editingDefinition.itemId
      ? findDefinitionItem(view, project.id, editingDefinition.itemId)
      : null;

  const listMarkup = items.length
    ? items
        .map(
          (item, index) =>
            config.inlineEdit && editingItem?.id === item.id
              ? renderDefinitionInlineEditForm(view, item, index, project.id)
              : `
                  <li class="definition-row">
                    <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
                    <div class="definition-copy">
                      ${
                        config.textEditTrigger
                          ? `
                            <button
                              class="definition-text-trigger"
                              type="button"
                              data-action="edit-definition"
                              data-definition-view="${view}"
                              data-item-id="${item.id}"
                              aria-label="Edit ${escapeHtml(config.singular)} ${escapeHtml(config.getDisplayName(item, { projectId: project.id }))}"
                            >
                              ${config.renderSummary(item, { projectId: project.id })}
                            </button>
                          `
                          : config.renderSummary(item, { projectId: project.id })
                      }
                    </div>
                    <div class="definition-actions">
                      ${renderActionIconButton({
                        action: "delete-definition",
                        icon: config.textEditTrigger ? "close" : "delete",
                        label: `Delete ${config.singular}`,
                        tone: "danger",
                        unframed: Boolean(config.textEditTrigger),
                        dataAttributes: {
                          "definition-view": view,
                          "item-id": item.id,
                        },
                      })}
                    </div>
                  </li>
                `,
        )
        .join("")
    : `
        <li class="definition-empty">
          ${escapeHtml(config.emptyMessage(project))}
        </li>
      `;

  return `
    <section class="definition-stack">
      ${renderDefinitionForm(view, config.inlineEdit ? null : editingItem, project.id)}

      <section class="definition-list-shell">
        <div class="definition-list-head">
          <p class="definition-list-title">${config.listTitle}</p>
          <span class="definition-list-count">${items.length}</span>
        </div>
        <ol class="definition-list">
          ${listMarkup}
        </ol>
      </section>
    </section>
  `;
};

const getDeliverableTypeAllocations = (deliverableType) => deliverableType?.allocations ?? [];

const renderTypeAllocationRow = (allocation, index, projectId) => `
  <div class="allocation-row" data-type-allocation-row>
    <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
    <label class="field rule-field">
      <span>Role</span>
      <select
        data-type-allocation-role
        ${getRoles(projectId).length ? "" : "disabled"}
      >
        ${renderSelectOptions(
          getRoleOptions(projectId),
          allocation.roleId,
          getRoles(projectId).length ? "Select a role" : "Add a role first",
        )}
      </select>
    </label>
    <button class="definition-action" type="button" data-action="remove-type-allocation-row">
      Remove
    </button>
  </div>
`;

const renderDeliverableTypeForm = ({ formId, projectId, deliverableType = null }) => {
  const isEditing = Boolean(deliverableType);
  const allocations = getDeliverableTypeAllocations(deliverableType).length
    ? getDeliverableTypeAllocations(deliverableType)
    : [createEmptyTypeAllocation()];

  return `
    <form
      class="type-form"
      id="${formId}"
      ${isEditing ? `data-deliverable-type-id="${deliverableType.id}"` : ""}
    >
      <label class="field">
        <span>Type name</span>
        <input
          type="text"
          data-deliverable-type-name
          value="${escapeHtml(deliverableType?.name ?? "")}"
          placeholder="Engineering drawings"
          autocomplete="off"
          required
        />
      </label>

      <label class="field">
        <span>Lifecycle stages</span>
        <select
          data-deliverable-type-rule-set
          ${getRuleSets(projectId).length ? "" : "disabled"}
          required
        >
          ${renderSelectOptions(
            getRuleSetOptions(projectId),
            getDeliverableTypeRuleSetId(deliverableType),
            getRuleSets(projectId).length
              ? "Select a lifecycle stage set"
              : "Add a lifecycle stage set first",
          )}
        </select>
      </label>

      <div class="type-allocation-group">
        <div class="type-allocation-group-head">
          <p class="definition-list-title">Roles Per Deliverable Type</p>
          <div class="type-allocation-group-tools">
            <span class="ruleset-count-pill" data-type-allocation-count>
              ${pluralize(allocations.length, "role")}
            </span>
            <button
              class="definition-action"
              type="button"
              data-action="add-type-allocation-row"
              ${getRoles(projectId).length ? "" : "disabled"}
            >
              Add role
            </button>
          </div>
        </div>
        <div class="type-allocation-grid" data-type-allocation-rows>
          ${allocations.map((allocation, index) => renderTypeAllocationRow(allocation, index, projectId)).join("")}
        </div>
      </div>

      <div class="type-form-actions">
        <button class="primary-button" type="submit">
          ${isEditing ? "Save type" : "Create type"}
        </button>
        ${
          isEditing
            ? `
              <button class="definition-action" type="button" data-action="cancel-deliverable-type-edit">
                Cancel
              </button>
            `
            : ""
        }
      </div>
    </form>
  `;
};

const renderDeliverableTypeCard = (deliverableType, projectId) => {
  if (deliverableType.id === editingDeliverableTypeId) {
    return `
      <article class="type-card type-card-editing">
        ${renderDeliverableTypeForm({
          formId: "deliverableTypeInlineEditForm",
          projectId,
          deliverableType,
        })}
      </article>
    `;
  }

  const allocations = getDeliverableTypeAllocations(deliverableType);
  const ruleSet = getDeliverableTypeRuleSet(projectId, deliverableType);

  return `
    <article class="type-card">
      <div class="type-card-head">
        <div class="type-card-copy">
          <h3 class="type-card-title">${escapeHtml(deliverableType.name)}</h3>
          <p class="type-card-meta">
            ${pluralize(allocations.length, "role")} · ${escapeHtml(ruleSet?.name ?? "No lifecycle set")}
          </p>
        </div>
        <div class="type-card-actions">
          <div class="definition-actions">
            ${renderActionIconButton({
              action: "edit-deliverable-type",
              icon: "edit",
              label: `Edit ${deliverableType.name}`,
              dataAttributes: {
                "deliverable-type-id": deliverableType.id,
              },
            })}
            ${renderActionIconButton({
              action: "delete-deliverable-type",
              icon: "delete",
              label: `Delete ${deliverableType.name}`,
              tone: "danger",
              dataAttributes: {
                "deliverable-type-id": deliverableType.id,
              },
            })}
          </div>
        </div>
      </div>

      <ol class="type-allocation-list">
        ${
          allocations.length
            ? allocations
                .map(
                  (allocation, index) => `
                    <li class="type-allocation-list-item">
                      <span class="ruleset-rule-order">${String(index + 1).padStart(2, "0")}</span>
                      <div class="ruleset-rule-copy">
                        <strong>${escapeHtml(getRoleDisplayName(projectId, allocation.roleId))}</strong>
                      </div>
                    </li>
                  `,
                )
                .join("")
            : `
                <li class="type-allocation-list-item">
                  <span class="ruleset-rule-order">00</span>
                  <div class="ruleset-rule-copy">
                    <strong>No roles defined</strong>
                  </div>
                </li>
              `
        }
      </ol>
    </article>
  `;
};

const renderDeliverableTypesBody = (project) => {
  const deliverableTypes = getDefinitionItems("types", project.id);
  const listMarkup = deliverableTypes.length
    ? deliverableTypes
        .map((deliverableType) => renderDeliverableTypeCard(deliverableType, project.id))
        .join("")
    : `
        <div class="definition-empty">
          No deliverable types yet for ${escapeHtml(project.name)}.
        </div>
      `;

  return `
    <section class="definition-stack">
      <section class="definition-list-shell">
        ${renderDeliverableTypeForm({
          formId: "deliverableTypeCreateForm",
          projectId: project.id,
        })}
      </section>

      <section class="definition-list-shell">
        <div class="definition-list-head">
          <p class="definition-list-title">Defined types</p>
          <span class="definition-list-count">${deliverableTypes.length}</span>
        </div>
        <div class="type-list">
          ${listMarkup}
        </div>
      </section>
    </section>
  `;
};

const renderStageRow = (stage, index) => `
  <div class="rule-row" data-stage-row>
    <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
    <input
      class="rule-row-input"
      type="text"
      data-stage-name
      value="${escapeHtml(stage.name)}"
      placeholder="Issued for review"
      autocomplete="off"
      aria-label="Stage name ${String(index + 1)}"
      required
    />
    ${renderActionIconButton({
      action: "remove-stage-row",
      icon: "close",
      label: `Remove stage ${index + 1}`,
      tone: "danger",
      unframed: true,
    })}
  </div>
`;

const renderRuleSetForm = ({ formId, ruleSet = null }) => {
  const isEditing = Boolean(ruleSet);
  const stages = ruleSet?.stages?.length ? ruleSet.stages : [createEmptyStage()];

  return `
    <form
      class="ruleset-form"
      id="${formId}"
      ${isEditing ? `data-rule-set-id="${ruleSet.id}"` : ""}
    >
      <label class="field">
        <span>Lifecycle stage set name</span>
        <input
          type="text"
          data-ruleset-name
          value="${escapeHtml(ruleSet?.name ?? "")}"
          placeholder="Design review workflow"
          autocomplete="off"
          required
        />
      </label>

      <div class="ruleset-rule-group">
        <div class="ruleset-rule-group-head">
          <p class="definition-list-title">Stages</p>
          <div class="ruleset-rule-group-tools">
            <span class="ruleset-count-pill" data-stage-count>
              ${pluralize(stages.length, "stage")}
            </span>
            <button class="ruleset-add-stage-button" type="button" data-action="add-stage-row">
              <span aria-hidden="true">+</span>
              <span>Add stage</span>
            </button>
          </div>
        </div>
        <div class="ruleset-rule-grid" data-stage-rows>
          ${stages.map((stage, index) => renderStageRow(stage, index)).join("")}
        </div>
      </div>

      ${
        isEditing
          ? ""
          : `
            <div class="ruleset-form-actions">
              <button class="primary-button" type="submit">
                Create set
              </button>
            </div>
          `
      }
    </form>
  `;
};

const renderRuleSetCard = (ruleSet) => {
  if (ruleSet.id === editingRuleSetId) {
    return `
      <article class="ruleset-card ruleset-card-editing">
        ${renderRuleSetForm({
          formId: "ruleSetInlineEditForm",
          ruleSet,
        })}
      </article>
    `;
  }

  return `
    <article class="ruleset-card">
      <div class="ruleset-card-head">
        <div class="ruleset-card-copy">
          <h3 class="ruleset-card-title">${escapeHtml(ruleSet.name)}</h3>
          <p class="ruleset-card-meta">${pluralize(ruleSet.stages.length, "stage")}</p>
        </div>
        <div class="ruleset-card-actions">
          <div class="definition-actions">
            ${renderActionIconButton({
              action: "edit-rule-set",
              icon: "edit",
              label: `Edit ${ruleSet.name}`,
              dataAttributes: {
                "rule-set-id": ruleSet.id,
              },
            })}
            ${renderActionIconButton({
              action: "delete-rule-set",
              icon: "delete",
              label: `Delete ${ruleSet.name}`,
              tone: "danger",
              dataAttributes: {
                "rule-set-id": ruleSet.id,
              },
            })}
          </div>
        </div>
      </div>

      <ol class="ruleset-rule-list">
        ${ruleSet.stages
          .map(
            (stage, index) => `
              <li class="ruleset-rule-list-item">
                <span class="ruleset-rule-order">${String(index + 1).padStart(2, "0")}</span>
                <div class="ruleset-rule-copy">
                  <strong>${escapeHtml(stage.name)}</strong>
                </div>
              </li>
            `,
          )
          .join("")}
      </ol>
    </article>
  `;
};

const getDeliverableAssignmentEntries = (deliverable, projectId) =>
  (deliverable.assignments ?? [])
    .map((assignment, index) => {
      const roleName = assignment.roleName ?? getRoleDisplayName(projectId, assignment.roleId);
      const memberName =
        findMember(projectId, assignment.memberId)?.name ?? assignment.memberName ?? "Unassigned";

      return {
        order: assignment.order ?? index,
        roleName,
        memberName,
      };
    })
    .sort((left, right) => left.order - right.order);

const getDeliverableAssignmentsDisplayValue = (deliverable, projectId) => {
  const entries = getDeliverableAssignmentEntries(deliverable, projectId);

  if (!entries.length) {
    return "—";
  }

  return entries
    .map((entry) => `${entry.roleName}: ${entry.memberName}`)
    .join(" · ");
};

const renderDeliverableAssignmentsCell = (deliverable, projectId) => {
  const entries = getDeliverableAssignmentEntries(deliverable, projectId);

  if (!entries.length) {
    return `<span class="deliverables-cell-empty">—</span>`;
  }

  return `
    <div class="deliverables-assignment-list">
      ${entries
        .map(
          (entry) => `
            <div class="deliverables-assignment-item">
              <span class="deliverables-assignment-role">${escapeHtml(entry.roleName)}</span>
              <strong class="deliverables-assignment-member">${escapeHtml(entry.memberName)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
};

const renderRulesOfCreditBody = (project) => {
  const ruleSets = getRuleSets(project.id);
  const listMarkup = ruleSets.length
    ? ruleSets.map((ruleSet) => renderRuleSetCard(ruleSet)).join("")
    : `
        <div class="definition-empty">
          No lifecycle stage sets yet for ${escapeHtml(project.name)}.
        </div>
      `;

  return `
    <section class="definition-stack">
      <section class="definition-list-shell">
        ${renderRuleSetForm({
          formId: "ruleSetCreateForm",
        })}
      </section>

      <section class="definition-list-shell ruleset-list-section">
        <div class="definition-list-head">
          <p class="definition-list-title">Defined lifecycle stage sets</p>
          <span class="definition-list-count">${ruleSets.length}</span>
        </div>
        <div class="ruleset-list">
          ${listMarkup}
        </div>
      </section>
    </section>
  `;
};

const getStageStatusLabel = (status = "pending") => {
  const labels = {
    active: "In progress",
    pending: "Not started",
    completed: "Done",
    skipped: "Skipped",
  };

  return labels[normalizeDeliverableStageStatus(status)] ?? "Not started";
};

const getStageStatusTone = (status = "pending") => {
  const tones = {
    active: "active",
    pending: "pending",
    completed: "completed",
    skipped: "skipped",
  };

  return tones[normalizeDeliverableStageStatus(status)] ?? "pending";
};

const DELIVERABLE_STAGE_STATUS_OPTIONS = ["pending", "active", "completed", "skipped"].map(
  (status) => ({
    value: status,
    label: getStageStatusLabel(status),
  }),
);

const isValidDeliverableStageStatus = (status) =>
  DELIVERABLE_STAGE_STATUS_OPTIONS.some(
    (option) => option.value === normalizeDeliverableStageStatus(status),
  );

const isValidStageDateInput = (value = "") => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeStageDateInput = (value = "") => value.trim() || null;

const formatStageDate = (value) => (value ? value : "—");

const getDeliverableStageEntry = (deliverable, projectId, order) =>
  getDeliverableStages(deliverable, projectId).find((stage) => (stage.order ?? 0) === order) ?? null;

const getDeliverableStageDisplayValue = (deliverable, projectId, order) => {
  const stage = getDeliverableStageEntry(deliverable, projectId, order);

  if (!stage) {
    return "—";
  }

  return `${getStageStatusLabel(stage.status)} · Exp ${formatStageDate(stage.expectedDate)} · Act ${formatStageDate(stage.completedDate)}`;
};

const renderDeliverableStageCell = (deliverable, projectId, order) => {
  const stage = getDeliverableStageEntry(deliverable, projectId, order);

  if (!stage) {
    return `<span class="deliverables-cell-empty">—</span>`;
  }

  return `
    <div class="deliverables-stage-cell">
      <span class="deliverables-stage-status is-${escapeHtml(getStageStatusTone(stage.status))}">
        ${escapeHtml(getStageStatusLabel(stage.status))}
      </span>
      <span class="deliverables-stage-meta">
        <span>Exp ${escapeHtml(formatStageDate(stage.expectedDate))}</span>
        <span>Act ${escapeHtml(formatStageDate(stage.completedDate))}</span>
      </span>
    </div>
  `;
};

const getDeliverableCurrentStage = (deliverable, projectId) => {
  const stages = getDeliverableStages(deliverable, projectId);

  return (
    stages.find((stage) => stage.status === "active") ??
    stages.find((stage) => stage.status === "pending") ??
    stages.at(-1) ??
    null
  );
};

const renderDeliverableCodeCell = (deliverable) => `
  <button
    class="deliverables-row-trigger${selectedDeliverableId === deliverable.id ? " is-selected" : ""}"
    type="button"
    data-action="open-deliverable-editor"
    data-deliverable-id="${escapeHtml(deliverable.id)}"
    aria-label="Open editor for deliverable ${escapeHtml(deliverable.code)}"
  >
    ${escapeHtml(deliverable.code)}
  </button>
`;

const renderDeliverableEditorField = (label, value) => `
  <div class="deliverable-editor-field">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  </div>
`;

const renderDeliverableStageOverview = (deliverable, projectId) => {
  const stages = getDeliverableStages(deliverable, projectId);

  return `
    <section class="deliverable-stage-overview">
      <div class="deliverable-stage-overview-head">
        <div>
          <p class="definition-list-title">Stage progress</p>
          <p class="deliverable-editor-description">
            Update the instantiated stage status and dates for this deliverable.
          </p>
        </div>
        <span class="ruleset-count-pill">${pluralize(stages.length, "stage")}</span>
      </div>
      <div class="deliverable-stage-overview-list deliverable-stage-editor-list">
        ${stages
          .map(
            (stage) => `
              <article
                class="deliverable-stage-overview-item deliverable-stage-editor-row"
                data-deliverable-stage-row
                data-stage-id="${escapeHtml(stage.id)}"
                data-stage-order="${escapeHtml(String(stage.order ?? 0))}"
                data-stage-name="${escapeHtml(stage.stageName)}"
              >
                <div class="deliverable-stage-editor-meta">
                  <span class="ruleset-rule-order">${String((stage.order ?? 0) + 1).padStart(2, "0")}</span>
                  <div class="deliverable-stage-overview-copy">
                    <strong>${escapeHtml(stage.stageName)}</strong>
                    <span>Shown in the current lifecycle sequence.</span>
                  </div>
                </div>
                <div class="deliverable-stage-editor-fields">
                  <label class="field">
                    <span>Status</span>
                    <select data-deliverable-stage-field="status">
                      ${renderSelectOptions(DELIVERABLE_STAGE_STATUS_OPTIONS, stage.status)}
                    </select>
                  </label>
                  <label class="field">
                    <span>Expected</span>
                    <input
                      type="date"
                      data-deliverable-stage-field="expectedDate"
                      value="${escapeHtml(stage.expectedDate ?? "")}"
                    />
                  </label>
                  <label class="field">
                    <span>Actual</span>
                    <input
                      type="date"
                      data-deliverable-stage-field="completedDate"
                      value="${escapeHtml(stage.completedDate ?? "")}"
                    />
                  </label>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
};

const renderDeliverableEditorSection = (project) => {
  const deliverable = getSelectedDeliverable(project.id);

  if (!deliverable) {
    return "";
  }

  const currentStage = getDeliverableCurrentStage(deliverable, project.id);

  return `
    <div class="deliverable-editor-head">
      <div class="deliverable-editor-copy">
        <p class="definition-list-title">Deliverable editor</p>
        <h3 class="deliverable-editor-title" id="deliverableEditorTitle">${escapeHtml(deliverable.code)}</h3>
        <p class="deliverable-editor-description">
          Update editable fields and team assignments while keeping the current table context visible.
        </p>
      </div>
      <button
        class="definition-action"
        type="button"
        data-action="close-deliverable-editor"
      >
        Close
      </button>
    </div>
    <form
      class="deliverable-form deliverable-editor-form"
      id="deliverableEditorForm"
      data-deliverable-id="${escapeHtml(deliverable.id)}"
    >
      <input type="hidden" data-deliverable-field="typeId" value="${escapeHtml(deliverable.typeId)}" />
      <input type="hidden" data-deliverable-field="ruleSetId" value="${escapeHtml(deliverable.ruleSetId)}" />

      <section class="deliverable-editor-summary">
        <div class="deliverable-editor-summary-grid">
          ${renderDeliverableEditorField(
            "Type",
            getDefinitionDisplayName("types", project.id, deliverable.typeId),
          )}
          ${renderDeliverableEditorField(
            "Lifecycle",
            getRuleSetDisplayName(project.id, deliverable.ruleSetId),
          )}
          ${renderDeliverableEditorField(
            "Current stage",
            currentStage ? `${currentStage.stageName} · ${getStageStatusLabel(currentStage.status)}` : "—",
          )}
          ${renderDeliverableEditorField(
            "Team slots",
            String(getDeliverableAssignmentEntries(deliverable, project.id).length),
          )}
        </div>
        <p class="deliverable-editor-note">
          Deliverable type and lifecycle stage set stay fixed after creation in v1, so they are shown here as read-only.
        </p>
      </section>

      <div class="deliverable-form-grid deliverable-editor-grid">
        <label class="field field-full">
          <span>Deliverable code</span>
          <input
            type="text"
            data-deliverable-field="code"
            value="${escapeHtml(deliverable.code)}"
            placeholder="DRW-001"
            autocomplete="off"
            required
          />
        </label>
        ${renderDeliverableSelectField({
          key: "phaseId",
          label: "Phase",
          options: getDefinitionOptions("phases", project.id),
          value: deliverable.phaseId ?? "",
          placeholderLabel: getDefinitionItems("phases", project.id).length
            ? "Select a phase"
            : "Add a phase first",
          required: true,
          disabled: !getDefinitionItems("phases", project.id).length,
        })}
        ${renderDeliverableSelectField({
          key: "wbsId",
          label: "WBS",
          options: getDefinitionOptions("wbs", project.id),
          value: deliverable.wbsId ?? "",
          placeholderLabel: getDefinitionItems("wbs", project.id).length
            ? "Select a WBS item"
            : "Add a WBS item first",
          required: true,
          disabled: !getDefinitionItems("wbs", project.id).length,
        })}
        ${renderDeliverableSelectField({
          key: "packageId",
          label: "Package",
          options: getDefinitionOptions("packages", project.id),
          value: deliverable.packageId ?? "",
          placeholderLabel: "No package",
        })}
      </div>
      <div data-deliverable-assignment-region>
        ${renderDeliverableAssignmentSection(
          project.id,
          deliverable.typeId,
          getDeliverableAssignmentSelectionMap(deliverable),
        )}
      </div>
      ${renderDeliverableStageOverview(deliverable, project.id)}
      <div class="deliverable-form-actions deliverable-editor-actions">
        <button
          class="definition-action definition-action-danger"
          type="button"
          data-action="delete-deliverable"
          style="margin-right: auto;"
        >
          Delete deliverable
        </button>
        <button class="definition-action" type="button" data-action="close-deliverable-editor">
          Close
        </button>
        <button class="primary-button" type="submit">
          Save changes
        </button>
      </div>
    </form>
  `;
};

const renderDeliverableEditorOverlay = (project) => {
  if (!getSelectedDeliverable(project.id)) {
    return "";
  }

  return `
    <button
      class="deliverable-editor-backdrop"
      type="button"
      data-action="close-deliverable-editor"
      aria-label="Close deliverable editor"
    ></button>
    <aside
      class="definition-list-shell deliverable-editor-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deliverableEditorTitle"
    >
      ${renderDeliverableEditorSection(project)}
    </aside>
  `;
};

const baseDeliverableColumns = [
  {
    key: "code",
    label: "Code",
    filterKind: "text",
    getDisplayValue: (deliverable) => deliverable.code,
    renderCell: (deliverable) => renderDeliverableCodeCell(deliverable),
  },
  {
    key: "typeId",
    label: "Type",
    filterKind: "select",
    getDisplayValue: (deliverable, projectId) =>
      getDefinitionDisplayName("types", projectId, deliverable.typeId),
    getFilterOptions: (projectId) => getDefinitionOptions("types", projectId),
  },
  {
    key: "assignments",
    label: "Team",
    filterKind: "text",
    getDisplayValue: (deliverable, projectId) =>
      getDeliverableAssignmentsDisplayValue(deliverable, projectId),
    renderCell: (deliverable, projectId) => renderDeliverableAssignmentsCell(deliverable, projectId),
    cellClassName: "deliverables-cell-team",
  },
  {
    key: "ruleSetId",
    label: "Lifecycle Stages",
    filterKind: "select",
    getDisplayValue: (deliverable, projectId) =>
      getRuleSetDisplayName(projectId, deliverable.ruleSetId),
    getFilterOptions: (projectId) => getRuleSetOptions(projectId),
  },
  {
    key: "phaseId",
    label: "Phase",
    filterKind: "select",
    getDisplayValue: (deliverable, projectId) =>
      getDefinitionDisplayName("phases", projectId, deliverable.phaseId),
    getFilterOptions: (projectId) => getDefinitionOptions("phases", projectId),
  },
  {
    key: "wbsId",
    label: "WBS",
    filterKind: "select",
    getDisplayValue: (deliverable, projectId) =>
      getDefinitionDisplayName("wbs", projectId, deliverable.wbsId),
    getFilterOptions: (projectId) => getDefinitionOptions("wbs", projectId),
  },
  {
    key: "packageId",
    label: "Package",
    filterKind: "select",
    getDisplayValue: (deliverable, projectId) =>
      deliverable.packageId
        ? getDefinitionDisplayName("packages", projectId, deliverable.packageId)
        : "—",
    getSortValue: (deliverable, projectId) =>
      deliverable.packageId
        ? getDefinitionDisplayName("packages", projectId, deliverable.packageId)
        : "",
    getFilterOptions: (projectId) => [
      {
        value: "__none__",
        label: "No package",
      },
      ...getDefinitionOptions("packages", projectId),
    ],
  },
];

const getActiveDeliverableStageRuleSet = (projectId) => {
  const ruleSetId = deliverablesTableState.filters.ruleSetId;
  return ruleSetId ? findRuleSet(projectId, ruleSetId) ?? null : null;
};

const getActiveDeliverablePhaseId = () => deliverablesTableState.filters.phaseId || "";

const shouldHideDeliverableColumn = (columnKey, projectId) =>
  (columnKey === "phaseId" && Boolean(getActiveDeliverablePhaseId())) ||
  (columnKey === "ruleSetId" && Boolean(getActiveDeliverableStageRuleSet(projectId)));

const getDeliverableColumns = (projectId) => {
  const activeRuleSet = getActiveDeliverableStageRuleSet(projectId);
  const dynamicStageColumns = activeRuleSet
    ? activeRuleSet.stages.map((stage, index) => ({
        key: `stage-${stage.id ?? index}`,
        label: stage.name,
        getDisplayValue: (deliverable) =>
          getDeliverableStageDisplayValue(deliverable, projectId, index),
        getSortValue: (deliverable) => {
          const stageEntry = getDeliverableStageEntry(deliverable, projectId, index);
          return stageEntry
            ? `${stageEntry.order ?? index}-${getStageStatusLabel(stageEntry.status)}-${formatStageDate(stageEntry.expectedDate)}-${formatStageDate(stageEntry.completedDate)}`
            : "";
        },
        renderCell: (deliverable) => renderDeliverableStageCell(deliverable, projectId, index),
        cellClassName: "deliverables-cell-stage",
      }))
    : [];

  return baseDeliverableColumns.flatMap((column) => {
    if (column.key === "ruleSetId") {
      return [
        ...(shouldHideDeliverableColumn(column.key, projectId) ? [] : [column]),
        ...dynamicStageColumns,
      ];
    }

    return shouldHideDeliverableColumn(column.key, projectId) ? [] : [column];
  });
};

const getMissingDeliverableRequirements = (projectId) => {
  const requirements = [
    {
      label: "deliverable type",
      isMissing: !getDefinitionItems("types", projectId).length,
    },
    {
      label: "lifecycle stage set",
      isMissing: !getRuleSets(projectId).length,
    },
    {
      label: "project phase",
      isMissing: !getDefinitionItems("phases", projectId).length,
    },
    {
      label: "WBS item",
      isMissing: !getDefinitionItems("wbs", projectId).length,
    },
    {
      label: "member",
      isMissing: !getMembers(projectId).length,
    },
  ];

  return requirements.filter((requirement) => requirement.isMissing).map((requirement) => requirement.label);
};

const getMissingDeliverableRequirementsSummary = (
  projectId,
  action = "adding deliverables",
) => {
  const missingRequirements = getMissingDeliverableRequirements(projectId);

  return {
    missingRequirements,
    message: missingRequirements.length
      ? `Create at least one ${formatLabelList(missingRequirements)} before ${action}.`
      : "",
    subject: missingRequirements.map(formatDefinitionLabel).join(" · "),
  };
};

const showMissingDeliverableRequirementsFeedback = (projectId) => {
  const { missingRequirements, message, subject } = getMissingDeliverableRequirementsSummary(
    projectId,
    "opening the deliverable form",
  );

  if (!missingRequirements.length) {
    return false;
  }

  openConfirmationModal({
    eyebrow: "Missing setup",
    title: "Cannot create deliverable",
    message,
    subjectLabel: "Missing definitions",
    subject,
    confirmLabel: "Close",
    confirmVariant: "primary",
    cancelHidden: true,
    onConfirm: () => {},
  });

  return true;
};

const getDeliverableColumnDisplayValue = (column, deliverable, projectId) =>
  column.getDisplayValue(deliverable, projectId);

const getDeliverableColumnSortValue = (column, deliverable, projectId) =>
  (column.getSortValue ?? column.getDisplayValue)(deliverable, projectId);

const renderDeliverableCellContent = (column, deliverable, projectId) =>
  column.renderCell
    ? column.renderCell(deliverable, projectId)
    : escapeHtml(getDeliverableColumnDisplayValue(column, deliverable, projectId));

const compareDeliverableValues = (leftValue, rightValue) => {
  const left = String(leftValue ?? "").trim();
  const right = String(rightValue ?? "").trim();

  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right, undefined, {
    sensitivity: "base",
    numeric: true,
  });
};

const renderSelectOptions = (options, selectedValue = "", placeholderLabel = null) => `
  ${
    placeholderLabel !== null
      ? `
        <option value="" ${selectedValue ? "" : "selected"}>
          ${escapeHtml(placeholderLabel)}
        </option>
      `
      : ""
  }
  ${options
    .map(
      (option) => `
        <option value="${escapeHtml(option.value)}" ${option.value === selectedValue ? "selected" : ""}>
          ${escapeHtml(option.label)}
        </option>
      `,
    )
    .join("")}
`;

const renderDeliverableFilterControl = (column, projectId) => {
  if (!column.filterKind) {
    return "";
  }

  const filterLabel = `Filter ${column.label.toLowerCase()}`;

  if (column.filterKind === "text") {
    return `
      <input
        class="deliverables-filter-control"
        type="search"
        data-deliverable-filter="${column.key}"
        value="${escapeHtml(deliverablesTableState.filters[column.key])}"
        placeholder="Filter"
        autocomplete="off"
        aria-label="${escapeHtml(filterLabel)}"
      />
    `;
  }

  return `
    <select
      class="deliverables-filter-control"
      data-deliverable-filter="${column.key}"
      aria-label="${escapeHtml(filterLabel)}"
    >
      ${renderSelectOptions(
        column.getFilterOptions(projectId),
        deliverablesTableState.filters[column.key],
        "All",
      )}
    </select>
  `;
};

const renderDeliverableHeaderCell = (column, projectId) => {
  const isActiveSort = deliverablesTableState.sortBy === column.key;
  const sortIndicator = isActiveSort
    ? deliverablesTableState.sortDirection === "asc"
      ? "↑"
      : "↓"
    : "↕";

  return `
    <th scope="col" aria-sort="${isActiveSort ? (deliverablesTableState.sortDirection === "asc" ? "ascending" : "descending") : "none"}">
      <div class="deliverables-header-cell">
        <button
          class="deliverables-sort-button${isActiveSort ? " is-active" : ""}"
          type="button"
          data-action="sort-deliverables"
          data-sort-key="${column.key}"
        >
          <span>${escapeHtml(column.label)}</span>
          <span class="deliverables-sort-indicator" aria-hidden="true">${sortIndicator}</span>
        </button>
        ${renderDeliverableFilterControl(column, projectId)}
      </div>
    </th>
  `;
};

const renderDeliverableTableViewControl = ({
  label,
  action,
  options,
  value,
  placeholderLabel,
}) => `
  <label class="deliverables-view-control">
    <span>${escapeHtml(label)}</span>
    <select data-action="${escapeHtml(action)}">
      ${renderSelectOptions(options, value, placeholderLabel)}
    </select>
  </label>
`;

const renderDeliverableStageViewControl = (projectId) =>
  renderDeliverableTableViewControl({
    label: "View stages",
    action: "deliverable-stage-view",
    options: getRuleSetOptions(projectId),
    value: deliverablesTableState.filters.ruleSetId,
    placeholderLabel: "All lifecycle sets",
  });

const renderDeliverablePhaseViewControl = (projectId) =>
  renderDeliverableTableViewControl({
    label: "View phase",
    action: "deliverable-phase-view",
    options: getDefinitionOptions("phases", projectId),
    value: deliverablesTableState.filters.phaseId,
    placeholderLabel: "All phases",
  });

const renderDeliverableSelectField = ({
  key,
  label,
  options,
  value = "",
  placeholderLabel,
  required = false,
  disabled = false,
}) => `
  <label class="field">
    <span>${escapeHtml(label)}</span>
    <select
      data-deliverable-field="${key}"
      ${required ? "required" : ""}
      ${disabled ? "disabled" : ""}
    >
      ${renderSelectOptions(options, value, placeholderLabel)}
    </select>
  </label>
`;

const renderDeliverableAssignmentSection = (
  projectId,
  typeId = "",
  selectedAssignments = new Map(),
) => {
  const deliverableType = findDefinitionItem("types", projectId, typeId);
  const assignmentTemplates = getDeliverableTypeAssignmentTemplates(projectId, typeId);
  const memberOptions = getMemberOptions(projectId);

  if (!deliverableType) {
    return `
      <section class="deliverable-assignment-group">
        <div class="deliverable-assignment-head">
          <div class="deliverable-assignment-copy">
            <p class="definition-list-title">Team assignments</p>
            <p class="deliverable-assignment-description">
              Select a deliverable type to load its required assignment roles.
            </p>
          </div>
        </div>
        <p class="deliverable-assignment-note">
          Choose a deliverable type before assigning project members.
        </p>
      </section>
    `;
  }

  if (!memberOptions.length) {
    return `
      <section class="deliverable-assignment-group">
        <div class="deliverable-assignment-head">
          <div class="deliverable-assignment-copy">
            <p class="definition-list-title">Team assignments</p>
            <p class="deliverable-assignment-description">
              ${escapeHtml(deliverableType.name)} requires one project member for each role.
            </p>
          </div>
          <span class="ruleset-count-pill">${pluralize(assignmentTemplates.length, "role")}</span>
        </div>
        <p class="deliverable-assignment-note">
          Add project members before creating a deliverable of this type.
        </p>
      </section>
    `;
  }

  return `
    <section class="deliverable-assignment-group">
      <div class="deliverable-assignment-head">
        <div class="deliverable-assignment-copy">
          <p class="definition-list-title">Team assignments</p>
          <p class="deliverable-assignment-description">
            Assign one project member to each role required by ${escapeHtml(deliverableType.name)}.
          </p>
        </div>
        <span class="ruleset-count-pill">${pluralize(assignmentTemplates.length, "role")}</span>
      </div>
      <div class="deliverable-assignment-grid">
        ${assignmentTemplates
          .map(
            (assignment) => `
              <div class="deliverable-assignment-row" data-deliverable-assignment-row data-role-id="${escapeHtml(assignment.roleId)}">
                <div class="deliverable-assignment-role">
                  <span class="ruleset-rule-order">${String(assignment.order + 1).padStart(2, "0")}</span>
                  <div class="deliverable-assignment-role-copy">
                    <strong>${escapeHtml(assignment.roleName)}</strong>
                    <span>Required role</span>
                  </div>
                </div>
                <label class="field">
                  <span>Project member</span>
                  <select data-deliverable-assignment-member required>
                    ${renderSelectOptions(
                      memberOptions,
                      selectedAssignments.get(assignment.roleId) ?? "",
                      "Select a member",
                    )}
                  </select>
                </label>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
};

const renderDeliverableForm = (project) => `
  <form class="deliverable-form" id="deliverableForm">
    <div class="deliverable-form-grid">
      <label class="field">
        <span>Deliverable code</span>
        <input
          type="text"
          data-deliverable-field="code"
          placeholder="DRW-001"
          autocomplete="off"
          required
        />
      </label>
      ${renderDeliverableSelectField({
        key: "typeId",
        label: "Type",
        options: getDefinitionOptions("types", project.id),
        placeholderLabel: getDefinitionItems("types", project.id).length
          ? "Select a type"
          : "Add a type first",
        required: true,
        disabled: !getDefinitionItems("types", project.id).length,
      })}
      ${renderDeliverableSelectField({
        key: "phaseId",
        label: "Phase",
        options: getDefinitionOptions("phases", project.id),
        value: getProjectDefaultPhaseId(project),
        placeholderLabel: getDefinitionItems("phases", project.id).length
          ? "Select a phase"
          : "Add a phase first",
        required: true,
        disabled: !getDefinitionItems("phases", project.id).length,
      })}
      ${renderDeliverableSelectField({
        key: "wbsId",
        label: "WBS",
        options: getDefinitionOptions("wbs", project.id),
        placeholderLabel: getDefinitionItems("wbs", project.id).length
          ? "Select a WBS item"
          : "Add a WBS item first",
        required: true,
        disabled: !getDefinitionItems("wbs", project.id).length,
      })}
      ${renderDeliverableSelectField({
        key: "packageId",
        label: "Package",
        options: getDefinitionOptions("packages", project.id),
        placeholderLabel: "No package",
      })}
    </div>
    <div data-deliverable-assignment-region>
      ${renderDeliverableAssignmentSection(project.id)}
    </div>
    <div class="deliverable-form-actions">
      <button class="definition-action" type="button" data-action="cancel-deliverable-modal">
        Cancel
      </button>
      <button class="primary-button" type="submit">
        Create deliverable
      </button>
    </div>
  </form>
`;

const renderDeliverableModalContent = (project) => `
  <div class="deliverable-modal-shell">
    <div
      class="deliverable-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deliverableModalTitle"
      aria-describedby="deliverableModalMessage"
    >
      <div class="deliverable-modal-head">
        <div class="deliverable-modal-copy">
          <p class="confirmation-dialog-eyebrow">New deliverable</p>
          <h3 class="confirmation-dialog-title" id="deliverableModalTitle">Create deliverable</h3>
          <p class="confirmation-dialog-message" id="deliverableModalMessage">
            Add a deliverable to ${escapeHtml(project.name)}.
          </p>
        </div>
        <button
          class="definition-action"
          type="button"
          data-action="cancel-deliverable-modal"
          aria-label="Close create deliverable dialog"
        >
          Close
        </button>
      </div>
      ${renderDeliverableForm(project)}
    </div>
  </div>
`;

const getFilteredSortedDeliverables = (projectId) => {
  const allDeliverables = [...getDeliverables(projectId)];
  const columns = getDeliverableColumns(projectId);
  const filterColumns = baseDeliverableColumns;
  const { filters, sortBy, sortDirection } = deliverablesTableState;

  const filteredDeliverables = allDeliverables.filter((deliverable) =>
    filterColumns.every((column) => {
      const filterValue = filters[column.key];

      if (!filterValue) {
        return true;
      }

      if (column.filterKind === "text") {
        return getDeliverableColumnDisplayValue(column, deliverable, projectId)
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }

      if (column.key === "packageId" && filterValue === "__none__") {
        return !deliverable.packageId;
      }

      return String(deliverable[column.key] ?? "") === filterValue;
    }),
  );

  const activeSortColumn =
    columns.find((column) => column.key === sortBy) ?? columns[0];

  return filteredDeliverables.sort((leftDeliverable, rightDeliverable) => {
    const comparison = compareDeliverableValues(
      getDeliverableColumnSortValue(activeSortColumn, leftDeliverable, projectId),
      getDeliverableColumnSortValue(activeSortColumn, rightDeliverable, projectId),
    );

    if (comparison !== 0) {
      return sortDirection === "asc" ? comparison : -comparison;
    }

    return compareDeliverableValues(leftDeliverable.code, rightDeliverable.code);
  });
};

const renderDeliverablesTableSection = (project) => {
  const allDeliverables = getDeliverables(project.id);
  const filteredDeliverables = getFilteredSortedDeliverables(project.id);
  const columns = getDeliverableColumns(project.id);
  const hasFilters = Object.values(deliverablesTableState.filters).some(Boolean);
  const selectedRuleSet = getActiveDeliverableStageRuleSet(project.id);
  const tableMinWidth = 1120 + (selectedRuleSet?.stages.length ?? 0) * 142;

  return `
    <div class="deliverables-table-head">
      <div class="definition-list-head">
        <p class="definition-list-title">Deliverables</p>
        <span class="definition-list-count">${allDeliverables.length}</span>
      </div>
      <div class="deliverables-table-actions">
        ${renderDeliverableStageViewControl(project.id)}
        ${renderDeliverablePhaseViewControl(project.id)}
        <button
          class="primary-button"
          type="button"
          data-action="open-deliverable-modal"
        >
          Create deliverable
        </button>
      </div>
    </div>
    <div class="deliverables-table-wrap">
      <table class="deliverables-table" style="min-width: ${tableMinWidth}px">
        <thead>
          <tr>
            ${columns.map((column) => renderDeliverableHeaderCell(column, project.id)).join("")}
          </tr>
        </thead>
        <tbody>
          ${
            filteredDeliverables.length
              ? filteredDeliverables
                  .map(
                    (deliverable) => `
                      <tr class="deliverables-row${selectedDeliverableId === deliverable.id ? " is-selected" : ""}">
                        ${columns
                          .map(
                            (column) => `
                              <td class="${escapeHtml(column.cellClassName ?? "")}">
                                ${renderDeliverableCellContent(column, deliverable, project.id)}
                              </td>
                            `,
                          )
                          .join("")}
                      </tr>
                    `,
                  )
                  .join("")
              : `
                  <tr>
                    <td class="deliverables-empty-cell" colspan="${columns.length}">
                      ${
                        hasFilters
                          ? "No deliverables match the current filters."
                          : `No deliverables yet for ${escapeHtml(project.name)}.`
                      }
                    </td>
                  </tr>
                `
          }
        </tbody>
      </table>
    </div>
  `;
};

const renderDeliverablesBody = (project) => {
  const { missingRequirements, message } = getMissingDeliverableRequirementsSummary(project.id);
  const hasSelectedDeliverable = Boolean(getSelectedDeliverable(project.id));

  return `
    <section class="definition-stack">
      ${
        missingRequirements.length
          ? `
            <div class="workspace-note">
              ${escapeHtml(message)}
            </div>
          `
          : ""
      }

      <div class="deliverables-layout">
        <section class="definition-list-shell deliverables-shell" id="deliverablesTableSection">
          ${renderDeliverablesTableSection(project)}
        </section>
      </div>
      <div
        class="deliverable-editor-overlay"
        id="deliverableEditorSection"
        ${hasSelectedDeliverable ? "" : "hidden"}
      >
        ${renderDeliverableEditorOverlay(project)}
      </div>
    </section>
  `;
};

const renderProjectEditorBody = () => {
  const project = projectEditorProjectId ? findProjectById(projectEditorProjectId) : null;
  const isEditing = Boolean(project);
  const canDelete = projects.length > 1;
  const phaseOptions = project ? getDefinitionOptions("phases", project.id) : [];
  const defaultPhaseId = getProjectDefaultPhaseId(project);
  const defaultPhasePlaceholder = project
    ? phaseOptions.length
      ? "No default phase"
      : "Add a phase first"
    : "Create the project first";

  return `
  <form class="project-form" id="projectForm" ${isEditing ? `data-project-id="${project.id}"` : ""}>
    <div class="form-row">
      <label class="field">
        <span>Project name</span>
        <input
          type="text"
          data-project-field="name"
          placeholder="Project name"
          autocomplete="off"
          required
          value="${escapeHtml(project?.name ?? "")}"
        />
      </label>
      <label class="field">
        <span>Project code</span>
        <input
          type="text"
          data-project-field="code"
          placeholder="PRJ-001"
          autocomplete="off"
          value="${escapeHtml(project?.code ?? "")}"
        />
      </label>
    </div>
    <div class="form-row">
      <label class="field">
        <span>Status</span>
        <select data-project-field="status">
          <option value="active" ${project?.archived ? "" : "selected"}>Active</option>
          <option value="archived" ${project?.archived ? "selected" : ""}>Archived</option>
        </select>
      </label>
      <label class="field">
        <span>Default phase</span>
        <select
          data-project-field="defaultPhaseId"
          ${phaseOptions.length ? "" : "disabled"}
        >
          ${renderSelectOptions(phaseOptions, defaultPhaseId, defaultPhasePlaceholder)}
        </select>
      </label>
    </div>
    <div class="project-form-actions">
      ${
        isEditing
          ? `
            <div>
              <button
                class="definition-action definition-action-danger"
                type="button"
                data-action="delete-project"
                ${canDelete ? "" : "disabled"}
              >
                Delete project
              </button>
              ${
                canDelete
                  ? ""
                  : `
                    <p class="project-form-delete-hint">
                      Keep at least one project in the workspace.
                    </p>
                  `
              }
            </div>
          `
          : "<span></span>"
      }
      <button class="primary-button" type="submit">${isEditing ? "Save project" : "Create project"}</button>
    </div>
  </form>
`;
};

const viewMeta = {
  deliverables: {
    title: "Deliverables",
    body: (project) => renderDeliverablesBody(project),
  },
  types: {
    title: "Deliverable Types",
    body: (project) => renderDeliverableTypesBody(project),
  },
  "rules-of-credit": {
    title: "Lifecycle Stages",
    body: (project) => renderRulesOfCreditBody(project),
  },
  phases: {
    title: "Phases",
    body: (project) => renderDefinitionBody("phases", project),
  },
  wbs: {
    title: "WBS",
    body: (project) => renderDefinitionBody("wbs", project),
  },
  packages: {
    title: "Packages",
    body: (project) => renderDefinitionBody("packages", project),
  },
  roles: {
    title: "Roles",
    body: (project) => renderDefinitionBody("roles", project),
  },
  members: {
    title: "Members",
    body: (project) => renderDefinitionBody("members", project),
  },
  "project-editor": {
    title: () => (projectEditorProjectId ? "Edit project" : "New project"),
    copy: () =>
      projectEditorProjectId
        ? "Update the selected project's name, code, status, or default phase. Deletion removes its project-scoped definitions and deliverables."
        : "Create a project record first, then define its phases, WBS items, packages, roles, members, deliverable types, and lifecycle stages. Set the default phase once phases exist.",
    eyebrow: "Projects",
    body: () => renderProjectEditorBody(),
  },
};

const collectDefinitionFormData = (form, view) => {
  const config = definitionConfigs[view];

  return config.fields.reduce((values, field) => {
    const input = form.querySelector(`[data-definition-field="${field.key}"]`);
    values[field.key] = input ? input.value.trim() : "";
    return values;
  }, {});
};

const validateDefinitionForm = (form, view, projectId, excludingId = null) => {
  const config = definitionConfigs[view];
  const values = collectDefinitionFormData(form, view);
  return config.validate(values, { projectId, excludingId });
};

const collectDeliverableTypeFormData = (form) => {
  const name = form.querySelector("[data-deliverable-type-name]")?.value.trim() ?? "";
  const ruleSetId = form.querySelector("[data-deliverable-type-rule-set]")?.value.trim() ?? "";
  const allocations = [...form.querySelectorAll("[data-type-allocation-row]")].map((row) => ({
    roleId: row.querySelector("[data-type-allocation-role]")?.value.trim() ?? "",
  }));

  return { name, ruleSetId, allocations };
};

const validateDeliverableTypeForm = (form, projectId, excludingId = null) => {
  const nameInput = form.querySelector("[data-deliverable-type-name]");
  const ruleSetSelect = form.querySelector("[data-deliverable-type-rule-set]");
  const allocationRows = [...form.querySelectorAll("[data-type-allocation-row]")];
  const payload = collectDeliverableTypeFormData(form);
  const seenRoles = new Set();

  if (!payload.name) {
    return {
      field: nameInput,
      message: "Type name is required.",
    };
  }

  if (hasDuplicateDefinitionField("types", projectId, "name", payload.name, excludingId)) {
    return {
      field: nameInput,
      message: "A deliverable type with this name already exists in the selected project.",
    };
  }

  if (!getRoles(projectId).length) {
    return {
      field: nameInput,
      message: "Add at least one role before creating deliverable types.",
    };
  }

  if (!getRuleSets(projectId).length) {
    return {
      field: ruleSetSelect ?? nameInput,
      message: "Add at least one lifecycle stage set before creating deliverable types.",
    };
  }

  if (!payload.ruleSetId) {
    return {
      field: ruleSetSelect,
      message: "Lifecycle stage set is required.",
    };
  }

  if (!findRuleSet(projectId, payload.ruleSetId)) {
    return {
      field: ruleSetSelect,
      message: "Choose a valid lifecycle stage set.",
    };
  }

  if (!allocationRows.length) {
    return {
      field: nameInput,
      message: "Add at least one role.",
    };
  }

  const allocations = [];

  for (const row of allocationRows) {
    const roleSelect = row.querySelector("[data-type-allocation-role]");
    const roleId = roleSelect?.value.trim() ?? "";

    if (!roleId) {
      return {
        field: roleSelect,
        message: "Role is required.",
      };
    }

    if (!findRole(projectId, roleId)) {
      return {
        field: roleSelect,
        message: "Choose a valid role.",
      };
    }

    if (seenRoles.has(roleId)) {
      return {
        field: roleSelect,
        message: "Each role may be used only once per deliverable type.",
      };
    }

    seenRoles.add(roleId);
    allocations.push({
      id: crypto.randomUUID(),
      roleId,
    });
  }

  return {
    payload: {
      name: payload.name,
      ruleSetId: payload.ruleSetId,
      allocations,
    },
  };
};

const collectRuleSetFormData = (form) => {
  const name = form.querySelector("[data-ruleset-name]")?.value.trim() ?? "";
  const stages = [...form.querySelectorAll("[data-stage-row]")].map((row) => ({
    name: row.querySelector("[data-stage-name]")?.value.trim() ?? "",
  }));

  return { name, stages };
};

const validateRuleSetForm = (form, projectId, excludingId = null) => {
  const ruleSetNameInput = form.querySelector("[data-ruleset-name]");
  const stageRows = [...form.querySelectorAll("[data-stage-row]")];
  const payload = collectRuleSetFormData(form);
  const seenStageNames = new Set();

  if (!payload.name) {
    return {
      field: ruleSetNameInput,
      message: "Lifecycle stage set name is required.",
    };
  }

  if (hasDuplicateRuleSet(projectId, payload.name, excludingId)) {
    return {
      field: ruleSetNameInput,
      message: "A lifecycle stage set with this name already exists in the selected project.",
    };
  }

  if (!stageRows.length) {
    return {
      field: ruleSetNameInput,
      message: "Add at least one stage.",
    };
  }

  for (const row of stageRows) {
    const nameInput = row.querySelector("[data-stage-name]");
    const normalizedStageName = normalizeValue(nameInput.value);

    if (!normalizedStageName) {
      return {
        field: nameInput,
        message: "Stage name is required.",
      };
    }

    if (seenStageNames.has(normalizedStageName)) {
      return {
        field: nameInput,
        message: "Stage names must be unique within a lifecycle stage set.",
      };
    }

    seenStageNames.add(normalizedStageName);
  }

  return {
    payload: {
      name: payload.name,
      stages: payload.stages.map((stage) => ({
        id: crypto.randomUUID(),
        name: stage.name,
      })),
    },
  };
};

const collectProjectFormData = (form) => ({
  name: form.querySelector('[data-project-field="name"]')?.value.trim() ?? "",
  code: form.querySelector('[data-project-field="code"]')?.value.trim() ?? "",
  status: form.querySelector('[data-project-field="status"]')?.value ?? "active",
  defaultPhaseId: form.querySelector('[data-project-field="defaultPhaseId"]')?.value.trim() ?? "",
});

const validateProjectValues = (
  { name, code, defaultPhaseId },
  { projectId = null, excludingId = null } = {},
) => {
  if (!name) {
    return {
      field: "name",
      message: "Project name is required.",
    };
  }

  if (
    projects.some(
      (project) =>
        project.id !== excludingId && normalizeValue(project.name) === normalizeValue(name),
    )
  ) {
    return {
      field: "name",
      message: "A project with this name already exists.",
    };
  }

  if (
    code &&
    projects.some(
      (project) =>
        project.id !== excludingId && normalizeValue(project.code) === normalizeValue(code),
    )
  ) {
    return {
      field: "code",
      message: "A project with this code already exists.",
    };
  }

  if (defaultPhaseId && (!projectId || !findDefinitionItem("phases", projectId, defaultPhaseId))) {
    return {
      field: "defaultPhaseId",
      message: "Choose a valid default phase.",
    };
  }

  return {
    payload: {
      name,
      code,
      defaultPhaseId,
    },
  };
};

const renderView = () => {
  if (currentView !== "deliverables") {
    closeDeliverableModal({ restoreFocus: false });
    selectedDeliverableId = null;
    document.body.classList.remove("has-drawer-open");
  }

  if (!currentProject && currentView !== "project-editor") {
    workspaceEyebrow.textContent = "Projects";
    workspaceTitle.textContent = "No projects yet";
    workspaceCopy.textContent = "Create a project to initialize the workspace.";
    workspaceCopy.hidden = false;
    workspacePanel.classList.toggle("workspace-panel-wide", false);
    workspaceBody.innerHTML = renderNoProjectsBody();
    workspaceBody.hidden = false;
    persistAppState();
    bindViewInteractions();
    return;
  }

  const config = viewMeta[currentView];
  const eyebrow =
    typeof config.eyebrow === "function" ? config.eyebrow(currentProject) : config.eyebrow;
  const title = typeof config.title === "function" ? config.title(currentProject) : config.title;
  const copy = typeof config.copy === "function" ? config.copy(currentProject) : config.copy ?? "";
  const bodySource = typeof config.body === "function" ? config.body(currentProject) : config.body;
  const body = bodySource ? bodySource.trim() : "";

  workspaceEyebrow.textContent = eyebrow ?? currentProject.name;
  workspaceTitle.textContent = title;
  workspaceCopy.textContent = copy;
  workspaceCopy.hidden = !copy;
  workspacePanel.classList.toggle("workspace-panel-wide", currentView === "deliverables");
  workspaceBody.innerHTML = body;
  workspaceBody.hidden = !body;
  persistAppState();
  bindViewInteractions();
};

const isMobileViewport = () => window.innerWidth <= 760;

const syncSidebarState = () => {
  if (!appShell) {
    return;
  }

  const mobileViewport = isMobileViewport();

  if (!mobileViewport) {
    sidebar.classList.remove("is-open");
  }

  appShell.classList.toggle("sidebar-collapsed", !mobileViewport && isDesktopSidebarCollapsed);
  menuToggle.setAttribute("aria-expanded", String(sidebar.classList.contains("is-open")));

  if (sidebarCollapseButton) {
    sidebarCollapseButton.setAttribute(
      "aria-label",
      mobileViewport
        ? "Close navigation menu"
        : isDesktopSidebarCollapsed
          ? "Expand left menu"
          : "Collapse left menu",
    );
    sidebarCollapseButton.setAttribute(
      "aria-expanded",
      String(mobileViewport ? sidebar.classList.contains("is-open") : !isDesktopSidebarCollapsed),
    );
  }

  if (sidebarCollapseIcon) {
    sidebarCollapseIcon.textContent =
      mobileViewport || !isDesktopSidebarCollapsed ? "‹" : "›";
  }
};

const closeSidebarOnMobile = () => {
  if (isMobileViewport()) {
    sidebar.classList.remove("is-open");
    syncSidebarState();
  }
};

const setActiveMenu = (view) => {
  menuItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
};

const closeProjectDropdown = () => {
  projectDropdown.hidden = true;
  projectTrigger.setAttribute("aria-expanded", "false");
};

const openProjectDropdown = () => {
  projectDropdown.hidden = false;
  projectTrigger.setAttribute("aria-expanded", "true");
};

const syncProjectSelection = () => {
  if (!currentProject) {
    if (activeProjectMark) {
      activeProjectMark.textContent = "PR";
    }

    activeProjectName.textContent = "No projects";
    activeProjectCode.textContent = "Create a project";
    projectTrigger.title = "No projects";
    editProjectOption.disabled = true;

    [...projectOptionList.querySelectorAll("[data-project-id]")].forEach((option) => {
      option.classList.remove("is-selected");
    });

    return;
  }

  if (activeProjectMark) {
    activeProjectMark.textContent = getProjectInitials(currentProject);
  }

  activeProjectName.textContent = currentProject.name;
  activeProjectCode.textContent = getProjectMetaLabel(currentProject);
  projectTrigger.title = currentProject.name;
  editProjectOption.disabled = false;

  [...projectOptionList.querySelectorAll("[data-project-id]")].forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.projectId === currentProject.id);
  });
};

const focusFirstField = (selector) => {
  const field = document.querySelector(selector);
  if (!field) return;

  field.focus();

  if ("select" in field) {
    field.select();
  }
};

const saveDefinitionForm = (form, view) => {
  const itemId = form.dataset.itemId ?? null;
  const validation = validateDefinitionForm(form, view, currentProject.id, itemId);

  if (!("payload" in validation)) {
    const field = form.querySelector(`[data-definition-field="${validation.field}"]`);
    showFieldError(field, validation.message);
    return false;
  }

  const items = getDefinitionItems(view, currentProject.id);

  if (itemId) {
    const item = items.find((entry) => entry.id === itemId);

    if (!item) {
      return false;
    }

    Object.assign(item, validation.payload);
  } else {
    items.push(createProjectScopedEntity(currentProject.id, validation.payload));
  }

  editingDefinition = {
    view: null,
    itemId: null,
  };
  renderView();
  return true;
};

const bindDefinitionForm = (form, view) => {
  if (!form) return;

  const isInlineEditForm = form.id === "definitionInlineEditForm";

  form.addEventListener("input", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      event.target.setCustomValidity("");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveDefinitionForm(form, view);
  });

  if (!isInlineEditForm) {
    return;
  }

  form.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (document.activeElement && form.contains(document.activeElement)) {
        return;
      }

      saveDefinitionForm(form, view);
    }, 0);
  });

  form.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveDefinitionForm(form, view);
    }
  });
};

const bindDefinitionView = (view) => {
  const form = document.getElementById("definitionForm");
  const inlineEditForm = document.getElementById("definitionInlineEditForm");
  const editButtons = workspaceBody.querySelectorAll('[data-action="edit-definition"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-definition"]');

  if (!form && !inlineEditForm) return;

  bindDefinitionForm(form, view);
  bindDefinitionForm(inlineEditForm, view);

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      editingDefinition = {
        view,
        itemId: button.dataset.itemId,
      };
      renderView();
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestDefinitionDeletion(view, button.dataset.itemId);
    });
  });

  if (inlineEditForm) {
    focusFirstField("#definitionInlineEditForm [data-definition-field]");
    return;
  }

  focusFirstField("#definitionForm [data-definition-field]");
};

const bindDeliverableTypesView = () => {
  const createForm = document.getElementById("deliverableTypeCreateForm");
  const inlineEditForm = document.getElementById("deliverableTypeInlineEditForm");
  const cancelButton = workspaceBody.querySelector('[data-action="cancel-deliverable-type-edit"]');
  const editButtons = workspaceBody.querySelectorAll('[data-action="edit-deliverable-type"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-deliverable-type"]');

  if (!createForm && !inlineEditForm) return;

  const bindDeliverableTypeForm = (form) => {
    if (!form) return;

    const rowsContainer = form.querySelector("[data-type-allocation-rows]");
    const addAllocationButton = form.querySelector('[data-action="add-type-allocation-row"]');
    const allocationCount = form.querySelector("[data-type-allocation-count]");

    if (!rowsContainer) {
      return;
    }

    const updateAllocationRowState = () => {
      const rows = [...rowsContainer.querySelectorAll("[data-type-allocation-row]")];

      rows.forEach((row, index) => {
        const indexLabel = row.querySelector(".definition-index");
        const removeButton = row.querySelector('[data-action="remove-type-allocation-row"]');

        if (indexLabel) {
          indexLabel.textContent = String(index + 1).padStart(2, "0");
        }

        if (removeButton) {
          removeButton.disabled = rows.length === 1;
        }
      });

      if (allocationCount) {
        allocationCount.textContent = pluralize(rows.length, "role");
      }
    };

    const appendAllocationRow = (allocation = createEmptyTypeAllocation()) => {
      rowsContainer.insertAdjacentHTML(
        "beforeend",
        renderTypeAllocationRow(
          allocation,
          rowsContainer.querySelectorAll("[data-type-allocation-row]").length,
          currentProject.id,
        ),
      );
      updateAllocationRowState();
    };

    addAllocationButton?.addEventListener("click", () => {
      appendAllocationRow();
      rowsContainer
        .querySelector("[data-type-allocation-row]:last-child [data-type-allocation-role]")
        ?.focus();
    });

    rowsContainer.addEventListener("click", (event) => {
      const removeButton = event.target.closest('[data-action="remove-type-allocation-row"]');

      if (!removeButton || removeButton.disabled) {
        return;
      }

      removeButton.closest("[data-type-allocation-row]")?.remove();
      updateAllocationRowState();
    });

    form.addEventListener("input", (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        event.target.setCustomValidity("");
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const deliverableTypeId = form.dataset.deliverableTypeId ?? null;
      const validation = validateDeliverableTypeForm(form, currentProject.id, deliverableTypeId);

      if (!("payload" in validation)) {
        showFieldError(validation.field, validation.message);
        return;
      }

      if (deliverableTypeId) {
        const deliverableType = getDefinitionItems("types", currentProject.id).find(
          (item) => item.id === deliverableTypeId,
        );

        if (!deliverableType) {
          return;
        }

        deliverableType.name = validation.payload.name;
        deliverableType.ruleSetId = validation.payload.ruleSetId;
        deliverableType.allocations = validation.payload.allocations;
        editingDeliverableTypeId = null;
      } else {
        getDefinitionItems("types", currentProject.id).push(
          createProjectScopedEntity(currentProject.id, validation.payload),
        );
      }

      renderView();
    });

    updateAllocationRowState();
  };

  bindDeliverableTypeForm(createForm);
  bindDeliverableTypeForm(inlineEditForm);

  cancelButton?.addEventListener("click", () => {
    editingDeliverableTypeId = null;
    renderView();
  });

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      editingDeliverableTypeId = button.dataset.deliverableTypeId;
      renderView();
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestDefinitionDeletion("types", button.dataset.deliverableTypeId);
    });
  });

  if (inlineEditForm) {
    focusFirstField("#deliverableTypeInlineEditForm [data-deliverable-type-name]");
    return;
  }

  focusFirstField("#deliverableTypeCreateForm [data-deliverable-type-name]");
};

const bindRuleSetView = () => {
  const createForm = document.getElementById("ruleSetCreateForm");
  const inlineEditForm = document.getElementById("ruleSetInlineEditForm");
  const editButtons = workspaceBody.querySelectorAll('[data-action="edit-rule-set"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-rule-set"]');

  if (!createForm && !inlineEditForm) return;

  const saveRuleSetForm = (form) => {
    const ruleSetId = form.dataset.ruleSetId ?? null;
    const validation = validateRuleSetForm(form, currentProject.id, ruleSetId);

    if (!("payload" in validation)) {
      showFieldError(validation.field, validation.message);
      return false;
    }

    if (ruleSetId) {
      const ruleSet = getRuleSets(currentProject.id).find((item) => item.id === ruleSetId);

      if (!ruleSet) {
        return false;
      }

      ruleSet.name = validation.payload.name;
      ruleSet.stages = validation.payload.stages;
      editingRuleSetId = null;
    } else {
      getRuleSets(currentProject.id).push(
        createProjectScopedEntity(currentProject.id, validation.payload),
      );
    }

    renderView();
    return true;
  };

  const bindRuleSetForm = (form) => {
    if (!form) return;

    const isInlineEditForm = form.id === "ruleSetInlineEditForm";
    const rowsContainer = form.querySelector("[data-stage-rows]");
    const addStageButton = form.querySelector('[data-action="add-stage-row"]');
    const stageCount = form.querySelector("[data-stage-count]");

    if (!rowsContainer) return;

    const updateStageRowState = () => {
      const rows = [...rowsContainer.querySelectorAll("[data-stage-row]")];

      rows.forEach((row, index) => {
        const indexLabel = row.querySelector(".definition-index");
        const removeButton = row.querySelector('[data-action="remove-stage-row"]');

        if (indexLabel) {
          indexLabel.textContent = String(index + 1).padStart(2, "0");
        }

        if (removeButton) {
          removeButton.disabled = rows.length === 1;
        }
      });

      if (stageCount) {
        stageCount.textContent = pluralize(rows.length, "stage");
      }
    };

    const appendStageRow = (stage = createEmptyStage()) => {
      rowsContainer.insertAdjacentHTML(
        "beforeend",
        renderStageRow(stage, rowsContainer.querySelectorAll("[data-stage-row]").length),
      );
      updateStageRowState();
    };

    addStageButton?.addEventListener("click", () => {
      appendStageRow();
      rowsContainer
        .querySelector("[data-stage-row]:last-child [data-stage-name]")
        ?.focus();
    });

    rowsContainer.addEventListener("click", (event) => {
      const removeButton = event.target.closest('[data-action="remove-stage-row"]');

      if (!removeButton || removeButton.disabled) {
        return;
      }

      removeButton.closest("[data-stage-row]")?.remove();
      updateStageRowState();
    });

    form.addEventListener("input", (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        event.target.setCustomValidity("");
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveRuleSetForm(form);
    });

    if (isInlineEditForm) {
      form.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (document.activeElement && form.contains(document.activeElement)) {
            return;
          }

          saveRuleSetForm(form);
        }, 0);
      });

      form.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveRuleSetForm(form);
        }
      });
    }

    updateStageRowState();
  };

  bindRuleSetForm(createForm);
  bindRuleSetForm(inlineEditForm);

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      editingRuleSetId = button.dataset.ruleSetId;
      renderView();
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestRuleSetDeletion(button.dataset.ruleSetId);
    });
  });

  if (inlineEditForm) {
    focusFirstField("#ruleSetInlineEditForm [data-ruleset-name]");
    return;
  }

  focusFirstField("#ruleSetCreateForm [data-ruleset-name]");
};

const collectDeliverableFormData = (form) => ({
  code: form.querySelector('[data-deliverable-field="code"]')?.value.trim() ?? "",
  typeId: form.querySelector('[data-deliverable-field="typeId"]')?.value.trim() ?? "",
  phaseId: form.querySelector('[data-deliverable-field="phaseId"]')?.value.trim() ?? "",
  wbsId: form.querySelector('[data-deliverable-field="wbsId"]')?.value.trim() ?? "",
  packageId: form.querySelector('[data-deliverable-field="packageId"]')?.value.trim() ?? "",
  assignments: [...form.querySelectorAll("[data-deliverable-assignment-row]")].map((row) => ({
    roleId: row.dataset.roleId ?? "",
    memberId: row.querySelector("[data-deliverable-assignment-member]")?.value.trim() ?? "",
  })),
});

const collectDeliverableStageFormData = (form) =>
  [...form.querySelectorAll("[data-deliverable-stage-row]")].map((row) => ({
    row,
    id: row.dataset.stageId ?? "",
    order: Number(row.dataset.stageOrder ?? "0"),
    stageName: row.dataset.stageName ?? "",
    status: row.querySelector('[data-deliverable-stage-field="status"]')?.value.trim() ?? "",
    expectedDate:
      row.querySelector('[data-deliverable-stage-field="expectedDate"]')?.value.trim() ?? "",
    completedDate:
      row.querySelector('[data-deliverable-stage-field="completedDate"]')?.value.trim() ?? "",
  }));

const validateDeliverableStageForm = (form, deliverable, projectId, ruleSetId = "") => {
  if (!deliverable) {
    return {
      stages: createDeliverableStagesFromRuleSet(findRuleSet(projectId, ruleSetId)),
    };
  }

  const existingStages = getDeliverableStages(deliverable, projectId);
  const stageRows = collectDeliverableStageFormData(form);

  if (stageRows.length !== existingStages.length) {
    return {
      field: "ruleSetId",
      message: "Refresh the stage progress editor and try again.",
    };
  }

  const inFlightStages = [];
  const stages = [];

  for (const stageRow of stageRows) {
    const statusField = stageRow.row.querySelector('[data-deliverable-stage-field="status"]');
    const expectedDateField = stageRow.row.querySelector('[data-deliverable-stage-field="expectedDate"]');
    const completedDateField = stageRow.row.querySelector('[data-deliverable-stage-field="completedDate"]');
    const normalizedStatus = normalizeDeliverableStageStatus(stageRow.status);
    const existingStage =
      existingStages.find((stage) => stage.id === stageRow.id) ??
      existingStages.find((stage) => (stage.order ?? 0) === stageRow.order) ??
      null;

    if (!existingStage) {
      return {
        field: "ruleSetId",
        message: "This deliverable contains invalid stages. Refresh and try again.",
      };
    }

    if (!isValidDeliverableStageStatus(stageRow.status)) {
      return {
        field: statusField,
        message: `Choose a valid status for ${existingStage.stageName}.`,
      };
    }

    if (!isValidStageDateInput(stageRow.expectedDate)) {
      return {
        field: expectedDateField,
        message: `Enter a valid expected date for ${existingStage.stageName}.`,
      };
    }

    if (!isValidStageDateInput(stageRow.completedDate)) {
      return {
        field: completedDateField,
        message: `Enter a valid actual date for ${existingStage.stageName}.`,
      };
    }

    const expectedDate = normalizeStageDateInput(stageRow.expectedDate);
    const completedDate = normalizeStageDateInput(stageRow.completedDate);

    if (normalizedStatus === "completed" && !completedDate) {
      return {
        field: completedDateField,
        message: `Enter an actual date for ${existingStage.stageName} when the stage is marked done.`,
      };
    }

    if (normalizedStatus === "active") {
      inFlightStages.push(existingStage.stageName);
    }

    stages.push({
      ...existingStage,
      status: normalizedStatus,
      expectedDate,
      completedDate,
    });
  }

  if (inFlightStages.length > 1) {
    return {
      field: form.querySelector('[data-deliverable-stage-field="status"]'),
      message: `Only one stage can be in progress at a time. Update ${formatLabelList(inFlightStages)}.`,
    };
  }

  return {
    stages,
  };
};

const validateDeliverableForm = (
  form,
  projectId,
  { excludingId = null, existingDeliverable = null } = {},
) => {
  const values = collectDeliverableFormData(form);
  const { missingRequirements, message: missingRequirementsMessage } =
    getMissingDeliverableRequirementsSummary(projectId);

  if (!values.code) {
    return {
      field: "code",
      message: "Deliverable code is required.",
    };
  }

  if (
    getDeliverables(projectId).some(
      (deliverable) =>
        deliverable.id !== excludingId &&
        normalizeValue(deliverable.code) === normalizeValue(values.code),
    )
  ) {
    return {
      field: "code",
      message: "A deliverable with this code already exists in the selected project.",
    };
  }

  if (missingRequirements.length) {
    return {
      field: "typeId",
      message: missingRequirementsMessage,
    };
  }

  if (!findDefinitionItem("types", projectId, values.typeId)) {
    return {
      field: "typeId",
      message: "Choose a valid deliverable type.",
    };
  }

  const deliverableType = findDefinitionItem("types", projectId, values.typeId);
  const ruleSetId = existingDeliverable?.ruleSetId ?? getDeliverableTypeRuleSetId(deliverableType);
  const ruleSet = findRuleSet(projectId, ruleSetId);

  if (!getMembers(projectId).length) {
    return {
      field: "typeId",
      message: "Add at least one member before creating deliverables.",
    };
  }

  if (!ruleSet) {
    return {
      field: "typeId",
      message: "The selected deliverable type does not have a valid lifecycle stage set.",
    };
  }

  if (!findDefinitionItem("phases", projectId, values.phaseId)) {
    return {
      field: "phaseId",
      message: "Choose a valid phase.",
    };
  }

  if (!findDefinitionItem("wbs", projectId, values.wbsId)) {
    return {
      field: "wbsId",
      message: "Choose a valid WBS item.",
    };
  }

  if (values.packageId && !findDefinitionItem("packages", projectId, values.packageId)) {
    return {
      field: "packageId",
      message: "Choose a valid package.",
    };
  }

  const stageValidation = validateDeliverableStageForm(
    form,
    existingDeliverable,
    projectId,
    ruleSetId,
  );

  if (!("stages" in stageValidation)) {
    return stageValidation;
  }

  const requiredAssignments = getDeliverableTypeAssignmentTemplates(projectId, values.typeId);
  const assignmentRows = [...form.querySelectorAll("[data-deliverable-assignment-row]")];

  if (
    getDeliverableTypeAllocations(deliverableType).length !== requiredAssignments.length ||
    !requiredAssignments.length
  ) {
    return {
      field: "typeId",
      message: "This deliverable type has invalid assignment roles. Update the type and try again.",
    };
  }

  if (assignmentRows.length !== requiredAssignments.length) {
    return {
      field: "typeId",
      message: "Refresh the team assignments for the selected deliverable type.",
    };
  }

  const assignments = [];

  for (const [index, row] of assignmentRows.entries()) {
    const roleId = row.dataset.roleId ?? "";
    const memberSelect = row.querySelector("[data-deliverable-assignment-member]");
    const memberId = memberSelect?.value.trim() ?? "";
    const role = findRole(projectId, roleId);

    if (!role) {
      return {
        field: "typeId",
        message: "This deliverable type contains an invalid role. Update the type and try again.",
      };
    }

    if (!memberId) {
      return {
        field: memberSelect,
        message: `Select a project member for ${role.name}.`,
      };
    }

    const member = findMember(projectId, memberId);

    if (!member) {
      return {
        field: memberSelect,
        message: `Choose a valid project member for ${role.name}.`,
      };
    }

    assignments.push({
      id: crypto.randomUUID(),
      roleId: role.id,
      roleName: role.name,
      memberId: member.id,
      order: index,
    });
  }

  return {
    payload: {
      code: values.code,
      typeId: values.typeId,
      ruleSetId,
      stages:
        existingDeliverable && existingDeliverable.ruleSetId === ruleSetId
          ? stageValidation.stages
          : createDeliverableStagesFromRuleSet(ruleSet),
      phaseId: values.phaseId,
      wbsId: values.wbsId,
      packageId: values.packageId || null,
      assignments,
    },
  };
};

const collectDeliverableAssignmentSelections = (form) =>
  new Map(
    [...form.querySelectorAll("[data-deliverable-assignment-row]")]
      .map((row) => [
        row.dataset.roleId ?? "",
        row.querySelector("[data-deliverable-assignment-member]")?.value.trim() ?? "",
      ])
      .filter(([roleId]) => roleId),
  );

const syncDeliverableAssignmentSection = (
  form,
  projectId,
  { focusFirstAssignment = false } = {},
) => {
  const assignmentRegion = form.querySelector("[data-deliverable-assignment-region]");
  const typeId = form.querySelector('[data-deliverable-field="typeId"]')?.value.trim() ?? "";

  if (!assignmentRegion) {
    return;
  }

  assignmentRegion.innerHTML = renderDeliverableAssignmentSection(
    projectId,
    typeId,
    collectDeliverableAssignmentSelections(form),
  );

  if (focusFirstAssignment) {
    assignmentRegion.querySelector("[data-deliverable-assignment-member]")?.focus();
  }
};

const syncDeliverableStageRowState = (row) => {
  if (!(row instanceof HTMLElement)) {
    return;
  }

  const statusField = row.querySelector('[data-deliverable-stage-field="status"]');
  const completedDateField = row.querySelector('[data-deliverable-stage-field="completedDate"]');

  if (!(completedDateField instanceof HTMLInputElement)) {
    return;
  }

  completedDateField.setCustomValidity("");
};

const syncDeliverableStageEditorSection = (form) => {
  form
    .querySelectorAll("[data-deliverable-stage-row]")
    .forEach((row) => syncDeliverableStageRowState(row));
};

const bindDeliverablesToolbar = () => {
  const openButton = workspaceBody.querySelector('[data-action="open-deliverable-modal"]');

  openButton?.addEventListener("click", () => {
    openDeliverableModal();
  });
};

const bindDeliverablesTableControls = () => {
  const sortButtons = workspaceBody.querySelectorAll('[data-action="sort-deliverables"]');
  const filterControls = workspaceBody.querySelectorAll("[data-deliverable-filter]");
  const stageViewControl = workspaceBody.querySelector('[data-action="deliverable-stage-view"]');
  const phaseViewControl = workspaceBody.querySelector('[data-action="deliverable-phase-view"]');

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sortKey = button.dataset.sortKey;

      if (!sortKey) {
        return;
      }

      if (deliverablesTableState.sortBy === sortKey) {
        deliverablesTableState.sortDirection =
          deliverablesTableState.sortDirection === "asc" ? "desc" : "asc";
      } else {
        deliverablesTableState.sortBy = sortKey;
        deliverablesTableState.sortDirection = "asc";
      }

      updateDeliverablesTableSection();
    });
  });

  filterControls.forEach((control) => {
    const eventName = control instanceof HTMLSelectElement ? "change" : "input";

    control.addEventListener(eventName, () => {
      const filterKey = control.dataset.deliverableFilter;

      if (!filterKey) {
        return;
      }

      deliverablesTableState.filters[filterKey] = control.value;
      updateDeliverablesTableSection({
        focusFilterKey: filterKey,
      });
    });
  });

  stageViewControl?.addEventListener("change", () => {
    deliverablesTableState.filters.ruleSetId = stageViewControl.value;
    updateDeliverablesTableSection({
      focusSelector: '[data-action="deliverable-stage-view"]',
    });
  });

  phaseViewControl?.addEventListener("change", () => {
    deliverablesTableState.filters.phaseId = phaseViewControl.value;
    updateDeliverablesTableSection({
      focusSelector: '[data-action="deliverable-phase-view"]',
      });
  });
};

const bindDeliverableRowButtons = () => {
  const rowButtons = workspaceBody.querySelectorAll('[data-action="open-deliverable-editor"]');

  rowButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const deliverableId = button.dataset.deliverableId;

      if (!deliverableId) {
        return;
      }

      openDeliverableEditor(deliverableId);
    });
  });
};

const syncDeliverableEditorOverlay = () => {
  const editorSection = document.getElementById("deliverableEditorSection");
  const hasSelectedDeliverable = Boolean(getSelectedDeliverable(currentProject.id));

  document.body.classList.toggle("has-drawer-open", hasSelectedDeliverable);

  if (editorSection) {
    editorSection.hidden = !hasSelectedDeliverable;

    if (!hasSelectedDeliverable) {
      editorSection.innerHTML = "";
    }
  }

  return hasSelectedDeliverable;
};

const updateDeliverablesTableSection = ({ focusFilterKey = null, focusSelector = null } = {}) => {
  const tableSection = document.getElementById("deliverablesTableSection");

  if (!tableSection) {
    return;
  }

  const activeElement = document.activeElement;
  const resolvedFocusFilterKey =
    focusFilterKey ??
    (activeElement instanceof HTMLElement ? activeElement.dataset.deliverableFilter ?? null : null);
  const selectionStart =
    activeElement instanceof HTMLInputElement ? activeElement.selectionStart ?? null : null;
  const selectionEnd =
    activeElement instanceof HTMLInputElement ? activeElement.selectionEnd ?? null : null;

  tableSection.innerHTML = renderDeliverablesTableSection(currentProject);
  bindDeliverablesToolbar();
  bindDeliverablesTableControls();
  bindDeliverableRowButtons();

  if (focusSelector) {
    tableSection.querySelector(focusSelector)?.focus();
    return;
  }

  if (!resolvedFocusFilterKey) {
    return;
  }

  const nextControl = tableSection.querySelector(
    `[data-deliverable-filter="${resolvedFocusFilterKey}"]`,
  );

  if (!(nextControl instanceof HTMLElement)) {
    return;
  }

  nextControl.focus();

  if (
    nextControl instanceof HTMLInputElement &&
    selectionStart !== null &&
    selectionEnd !== null
  ) {
    nextControl.setSelectionRange(
      Math.min(selectionStart, nextControl.value.length),
      Math.min(selectionEnd, nextControl.value.length),
    );
  }
};

const updateDeliverableEditorSection = ({ focusField = false } = {}) => {
  const editorSection = document.getElementById("deliverableEditorSection");

  if (selectedDeliverableId && !getSelectedDeliverable(currentProject.id)) {
    selectedDeliverableId = null;
  }

  const hasSelectedDeliverable = syncDeliverableEditorOverlay();

  if (!editorSection || !hasSelectedDeliverable) {
    return;
  }

  editorSection.innerHTML = renderDeliverableEditorOverlay(currentProject);
  bindDeliverableEditorSection();

  if (focusField) {
    focusFirstField("#deliverableEditorForm [data-deliverable-field=\"code\"]");
  }
};

const openDeliverableEditor = (deliverableId) => {
  if (!getDeliverableById(currentProject.id, deliverableId)) {
    return;
  }

  selectedDeliverableId = deliverableId;
  updateDeliverablesTableSection();
  updateDeliverableEditorSection({ focusField: true });
};

const closeDeliverableEditor = () => {
  if (!selectedDeliverableId) {
    return;
  }

  selectedDeliverableId = null;
  updateDeliverablesTableSection();
  updateDeliverableEditorSection();
};

const bindDeliverableForm = (
  form,
  { projectId = currentProject?.id ?? "", deliverable = null, onSuccess = null } = {},
) => {
  if (!form) {
    return;
  }

  const typeSelect = form.querySelector('[data-deliverable-field="typeId"]');

  form.addEventListener("input", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      event.target.setCustomValidity("");
    }
  });

  form.addEventListener("change", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      event.target.setCustomValidity("");
    }

    if (event.target === typeSelect) {
      syncDeliverableAssignmentSection(form, projectId, {
        focusFirstAssignment: true,
      });
      return;
    }

    if (
      event.target instanceof HTMLSelectElement &&
      event.target.dataset.deliverableStageField === "status"
    ) {
      syncDeliverableStageRowState(event.target.closest("[data-deliverable-stage-row]"));
    }
  });

  syncDeliverableStageEditorSection(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const validation = validateDeliverableForm(form, projectId, {
      excludingId: deliverable?.id ?? null,
      existingDeliverable: deliverable,
    });

    if (!("payload" in validation)) {
      const field =
        validation.field instanceof HTMLElement
          ? validation.field
          : form.querySelector(`[data-deliverable-field="${validation.field}"]`);
      showFieldError(field, validation.message);
      return;
    }

    const savedDeliverable = deliverable ?? createProjectScopedEntity(projectId, validation.payload);

    Object.assign(savedDeliverable, validation.payload);

    if (!deliverable) {
      getDeliverables(projectId).push(savedDeliverable);
    }

    onSuccess?.(savedDeliverable);
  });
};

const bindDeliverableModal = () => {
  const form = deliverableModal.querySelector("#deliverableForm");
  const closeButtons = deliverableModal.querySelectorAll('[data-action="cancel-deliverable-modal"]');

  bindDeliverableForm(form, {
    onSuccess: () => {
      closeDeliverableModal();
      updateDeliverablesTableSection();
      updateDeliverableEditorSection();
    },
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeDeliverableModal();
    });
  });
};

const bindDeliverableEditorSection = () => {
  const form = document.getElementById("deliverableEditorForm");
  const closeButtons = workspaceBody.querySelectorAll('[data-action="close-deliverable-editor"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-deliverable"]');
  const deliverableId = form?.dataset.deliverableId ?? "";
  const deliverable = deliverableId ? getDeliverableById(currentProject.id, deliverableId) : null;

  bindDeliverableForm(form, {
    deliverable,
    onSuccess: (savedDeliverable) => {
      selectedDeliverableId = savedDeliverable.id;
      updateDeliverablesTableSection();
      updateDeliverableEditorSection();
    },
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeDeliverableEditor();
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (deliverableId) requestDeliverableDeletion(deliverableId);
    });
  });
};

const bindDeliverablesView = () => {
  bindDeliverablesToolbar();
  bindDeliverablesTableControls();
  bindDeliverableRowButtons();
  bindDeliverableEditorSection();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "project";

const buildProjectId = (name) => {
  const baseId = slugify(name);
  let candidate = baseId;
  let index = 2;

  while (projects.some((project) => project.id === candidate)) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }

  return candidate;
};

const bindProjectEditorView = () => {
  const form = document.getElementById("projectForm");
  const deleteButton = workspaceBody.querySelector('[data-action="delete-project"]');

  if (!form) return;

  form.addEventListener("input", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      event.target.setCustomValidity("");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const editingProjectId = form.dataset.projectId ?? null;
    const nameInput = form.querySelector('[data-project-field="name"]');
    const codeInput = form.querySelector('[data-project-field="code"]');
    const defaultPhaseInput = form.querySelector('[data-project-field="defaultPhaseId"]');
    const values = collectProjectFormData(form);
    const archived = values.status === "archived";
    const validation = validateProjectValues(values, {
      projectId: editingProjectId,
      excludingId: editingProjectId,
    });

    if (!("payload" in validation)) {
      const field =
        validation.field === "name"
          ? nameInput
          : validation.field === "code"
            ? codeInput
            : validation.field === "defaultPhaseId"
              ? defaultPhaseInput
            : null;
      showFieldError(field, validation.message);
      return;
    }

    if (editingProjectId) {
      const project = findProjectById(editingProjectId);

      if (!project) {
        return;
      }

      Object.assign(project, validation.payload, { archived });
      currentProject = project;
    } else {
      const project = {
        id: buildProjectId(values.name),
        ...validation.payload,
        archived,
      };

      projects = [...projects, project];
      projectStateStore[project.id] = createProjectState();
      currentProject = project;
    }

    resetDeliverablesTableState();
    currentView = "deliverables";
    closeProjectEditor();
    resetDefinitionEditingState();
    renderProjectOptions();
    syncProjectSelection();
    setActiveMenu(currentView);
    renderView();
    closeProjectDropdown();
    closeSidebarOnMobile();
  });

  deleteButton?.addEventListener("click", () => {
    const editingProjectId = form.dataset.projectId ?? null;
    if (!editingProjectId) {
      return;
    }

    requestProjectDeletion(editingProjectId);
  });

  focusFirstField('[data-project-field="name"]');
};

const bindViewInteractions = () => {
  if (!currentProject && currentView !== "project-editor") {
    workspaceBody
      .querySelector('[data-action="open-project-editor-empty"]')
      ?.addEventListener("click", () => {
        openProjectEditor();
      });
    return;
  }

  if (currentView === "deliverables") {
    bindDeliverablesView();
    return;
  }

  if (currentView === "types") {
    bindDeliverableTypesView();
    return;
  }

  if (definitionConfigs[currentView]) {
    bindDefinitionView(currentView);
    return;
  }

  if (currentView === "rules-of-credit") {
    bindRuleSetView();
    return;
  }

  if (currentView === "project-editor") {
    bindProjectEditorView();
  }
};

menuToggle.addEventListener("click", () => {
  if (!isMobileViewport()) {
    return;
  }

  const nextState = !sidebar.classList.contains("is-open");
  sidebar.classList.toggle("is-open", nextState);
  syncSidebarState();
});

sidebarCollapseButton?.addEventListener("click", () => {
  if (isMobileViewport()) {
    sidebar.classList.remove("is-open");
  } else {
    isDesktopSidebarCollapsed = !isDesktopSidebarCollapsed;
  }

  closeProjectDropdown();
  syncSidebarState();
});

projectTrigger.addEventListener("click", () => {
  if (projectDropdown.hidden) {
    openProjectDropdown();
  } else {
    closeProjectDropdown();
  }
});

projectOptionList.addEventListener("click", (event) => {
  const option = event.target.closest("[data-project-id]");

  if (!option) {
    return;
  }

  currentProject =
    projects.find((project) => project.id === option.dataset.projectId) ?? currentProject;
  closeDeliverableModal({ restoreFocus: false });
  selectedDeliverableId = null;
  resetDeliverablesTableState();
  resetDefinitionEditingState();
  closeProjectEditor();

  if (currentView === "project-editor") {
    currentView = "deliverables";
    setActiveMenu(currentView);
  }

  syncProjectSelection();
  renderView();
  closeProjectDropdown();
  closeSidebarOnMobile();
});

editProjectOption.addEventListener("click", () => {
  if (!currentProject) {
    return;
  }

  openProjectEditor(currentProject.id);
});

addProjectOption.addEventListener("click", () => {
  openProjectEditor();
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    currentView = item.dataset.view;
    closeProjectEditor();
    resetDefinitionEditingState();
    if (currentView !== "deliverables") {
      selectedDeliverableId = null;
    }
    setActiveMenu(currentView);
    renderView();
    closeProjectDropdown();
    closeSidebarOnMobile();
  });
});

confirmationDialogCancel.addEventListener("click", () => {
  closeConfirmationModal();
});

confirmationDialogConfirm.addEventListener("click", () => {
  const onConfirm = pendingConfirmationAction;

  closeConfirmationModal({ restoreFocus: false });
  onConfirm?.();
});

deliverableModal.addEventListener("click", (event) => {
  if (event.target === deliverableModal) {
    closeDeliverableModal();
  }
});

confirmationModal.addEventListener("click", (event) => {
  if (event.target === confirmationModal) {
    closeConfirmationModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isDeliverableModalOpen()) {
    event.preventDefault();
    closeDeliverableModal();
    return;
  }

  if (event.key === "Escape" && currentProject && getSelectedDeliverable(currentProject.id)) {
    event.preventDefault();
    closeDeliverableEditor();
    return;
  }

  if (event.key === "Escape" && isConfirmationModalOpen()) {
    event.preventDefault();
    closeConfirmationModal();
  }
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Node)) {
    return;
  }

  if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
    closeSidebarOnMobile();
  }

  if (!projectTrigger.contains(event.target) && !projectDropdown.contains(event.target)) {
    closeProjectDropdown();
  }
});

menuItems.forEach((item) => {
  const label = item.querySelector(".menu-item-label")?.textContent.trim();

  if (label) {
    item.setAttribute("aria-label", label);
    item.title = label;
  }
});

window.addEventListener("resize", () => {
  syncSidebarState();
});

syncSidebarState();
renderProjectOptions();
syncProjectSelection();
renderView();
