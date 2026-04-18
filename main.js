const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const menuItems = [...document.querySelectorAll(".menu-item")];
const projectTrigger = document.getElementById("projectTrigger");
const projectDropdown = document.getElementById("projectDropdown");
const projectOptionList = document.getElementById("projectOptionList");
const editProjectOption = document.getElementById("editProjectOption");
const addProjectOption = document.getElementById("addProjectOption");
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

const createProjectFromOption = (option) => ({
  id: option.dataset.projectId,
  name: option.dataset.projectName,
  code: option.dataset.projectCode ?? "",
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

const normalizeProjectScopedCollection = (projectId, collection = []) => {
  collection.forEach((item) => {
    if (item && typeof item === "object") {
      item.projectId = projectId;
    }
  });

  return collection;
};

const createEmptyStage = () => ({
  name: "",
});

const createDeliverablesTableFilters = () => ({
  code: "",
  typeId: "",
  ruleSetId: "",
  phaseId: "",
  wbsId: "",
  packageId: "",
});

let projects = [...projectOptionList.querySelectorAll("[data-project-id]")].map((option) =>
  createProjectFromOption(option),
);

const projectStateStore = Object.fromEntries(
  projects.map((project) => [project.id, createProjectState()]),
);

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
    listTitle: "Defined members",
    emptyMessage: (project) => `No members yet for ${project.name}.`,
    getDisplayName: (item, { projectId }) => `${item.name} · ${getRoleDisplayName(projectId, item.roleId)}`,
    fields: [
      {
        key: "name",
        label: "Member name",
        placeholder: "Jamie Chen",
        required: true,
      },
      {
        key: "roleId",
        label: "Role",
        type: "select",
        required: true,
        options: ({ projectId }) => getRoleOptions(projectId),
        placeholderOption: ({ projectId }) =>
          getRoles(projectId).length ? "Select a role" : "Add a role first",
        isDisabled: ({ projectId }) => !getRoles(projectId).length,
      },
    ],
    renderSummary: (item, { projectId }) => `
      <div class="definition-copy-stack">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(getRoleDisplayName(projectId, item.roleId))}</span>
      </div>
    `,
    validate(values, { projectId }) {
      if (!values.name) {
        return {
          field: "name",
          message: "Member name is required.",
        };
      }

      if (!getRoles(projectId).length) {
        return {
          field: "roleId",
          message: "Add at least one role before creating members.",
        };
      }

      if (!values.roleId) {
        return {
          field: "roleId",
          message: "Role is required.",
        };
      }

      if (!findRole(projectId, values.roleId)) {
        return {
          field: "roleId",
          message: "Choose a valid role.",
        };
      }

      return {
        payload: {
          name: values.name,
          roleId: values.roleId,
        },
      };
    },
  },
};

let currentProject = projects[0];
let currentView = "deliverables";
let projectEditorProjectId = null;
let pendingConfirmationAction = null;
let confirmationReturnFocus = null;
let deliverableModalReturnFocus = null;
let deliverablesTableState = {
  sortBy: "code",
  sortDirection: "asc",
  filters: createDeliverablesTableFilters(),
};
let editingDefinition = {
  view: null,
  itemId: null,
};
let editingRuleSetId = null;

const getProjectState = (projectId) => {
  if (!projectStateStore[projectId]) {
    projectStateStore[projectId] = createProjectState();
  }

  const projectState = projectStateStore[projectId];

  PROJECT_SCOPED_COLLECTION_KEYS.forEach((key) => {
    projectState[key] = normalizeProjectScopedCollection(projectId, projectState[key]);
  });

  return projectState;
};

const getDefinitionItems = (view, projectId) => getProjectState(projectId)[view];

const getRuleSets = (projectId) => getProjectState(projectId).ruleSets;

const getDeliverables = (projectId) => getProjectState(projectId).deliverables;

const getRoles = (projectId) => getProjectState(projectId).roles;

const getMembers = (projectId) => getProjectState(projectId).members;

const findDefinitionItem = (view, projectId, itemId) =>
  getDefinitionItems(view, projectId).find((item) => item.id === itemId);

const findRuleSet = (projectId, ruleSetId) =>
  getRuleSets(projectId).find((item) => item.id === ruleSetId);

const findRole = (projectId, roleId) => getRoles(projectId).find((item) => item.id === roleId);

const getRoleOptions = (projectId) =>
  getRoles(projectId).map((role) => ({
    value: role.id,
    label: role.name,
  }));

const getRoleDisplayName = (projectId, roleId) => findRole(projectId, roleId)?.name ?? "Unknown role";

const getMembersForRole = (projectId, roleId) =>
  getMembers(projectId).filter((member) => member.roleId === roleId);

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

const resetDeliverablesTableState = () => {
  deliverablesTableState = {
    sortBy: "code",
    sortDirection: "asc",
    filters: createDeliverablesTableFilters(),
  };
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
    const membersUsingRole = getMembersForRole(currentProject.id, itemId);

    if (membersUsingRole.length) {
      openConfirmationModal({
        title: "Cannot delete role",
        message: `Reassign or remove ${pluralize(membersUsingRole.length, "member")} before deleting this role from ${currentProject.name}.`,
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

  if (dependentDeliverables.length) {
    openConfirmationModal({
      title: "Cannot delete lifecycle stage set",
      message: `Remove or update ${pluralize(dependentDeliverables.length, "deliverable")} before deleting this lifecycle stage set from ${currentProject.name}.`,
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

const deleteProject = (projectId) => {
  projects = projects.filter((entry) => entry.id !== projectId);
  delete projectStateStore[projectId];
  currentProject = projects[0];
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
  const codeLabel = project.code || "No code";
  return project.archived ? `${codeLabel} · Archived` : codeLabel;
};

const renderProjectOptions = () => {
  projectOptionList.innerHTML = projects
    .map(
      (project) => `
        <button
          class="project-option${project.id === currentProject.id ? " is-selected" : ""}"
          type="button"
          data-project-id="${escapeHtml(project.id)}"
          data-project-name="${escapeHtml(project.name)}"
          data-project-code="${escapeHtml(project.code)}"
          data-project-archived="${project.archived ? "true" : "false"}"
        >
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(getProjectMetaLabel(project))}</span>
        </button>
      `,
    )
    .join("");
};

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

const renderDefinitionForm = (view, item = null, projectId = currentProject.id) => {
  const config = definitionConfigs[view];
  const values = item ?? {};
  const isEditing = Boolean(item);
  const gridClass = config.fields.length === 1 ? " definition-form-grid-single" : "";

  return `
    <form
      class="definition-form"
      id="definitionForm"
      data-definition-view="${view}"
      ${isEditing ? `data-item-id="${item.id}"` : ""}
    >
      <div class="definition-form-grid${gridClass}">
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

const renderDefinitionInlineEditForm = (view, item, index, projectId = currentProject.id) => {
  const config = definitionConfigs[view];
  const gridClass = config.fields.length === 1 ? " definition-inline-grid-single" : "";

  return `
    <li>
      <form
        class="definition-row definition-row-editing definition-row-inline-edit"
        id="definitionInlineEditForm"
        data-definition-view="${view}"
        data-item-id="${item.id}"
      >
        <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="definition-inline-grid${gridClass}">
          ${config.fields
            .map((field) => renderDefinitionField(field, item[field.key] ?? "", { projectId }))
            .join("")}
        </div>
        <div class="definition-actions">
          <button class="definition-action definition-action-primary" type="submit">
            Save
          </button>
          <button class="definition-action" type="button" data-action="cancel-definition-edit">
            Cancel
          </button>
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
                      ${config.renderSummary(item, { projectId: project.id })}
                    </div>
                    <div class="definition-actions">
                      <button
                        class="definition-action"
                        type="button"
                        data-action="edit-definition"
                        data-definition-view="${view}"
                        data-item-id="${item.id}"
                      >
                        Edit
                      </button>
                      <button
                        class="definition-action definition-action-danger"
                        type="button"
                        data-action="delete-definition"
                        data-definition-view="${view}"
                        data-item-id="${item.id}"
                      >
                        Delete
                      </button>
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

const renderStageRow = (stage, index) => `
  <div class="rule-row" data-stage-row>
    <span class="definition-index">${String(index + 1).padStart(2, "0")}</span>
    <label class="field rule-field">
      <span>Stage name</span>
      <input
        type="text"
        data-stage-name
        value="${escapeHtml(stage.name)}"
        placeholder="Issued for review"
        autocomplete="off"
        required
      />
    </label>
    <button class="definition-action" type="button" data-action="remove-stage-row">
      Remove
    </button>
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
          placeholder="IFR package"
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
            <button class="definition-action" type="button" data-action="add-stage-row">
              Add stage
            </button>
          </div>
        </div>
        <div class="ruleset-rule-grid" data-stage-rows>
          ${stages.map((stage, index) => renderStageRow(stage, index)).join("")}
        </div>
      </div>

      <div class="ruleset-form-actions">
        <button class="primary-button" type="submit">
          ${isEditing ? "Save set" : "Create set"}
        </button>
        ${
          isEditing
            ? `
              <button class="definition-action" type="button" data-action="cancel-rule-set-edit">
                Cancel
              </button>
            `
            : ""
        }
      </div>
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
            <button
              class="definition-action"
              type="button"
              data-action="edit-rule-set"
              data-rule-set-id="${ruleSet.id}"
            >
              Edit
            </button>
            <button
              class="definition-action definition-action-danger"
              type="button"
              data-action="delete-rule-set"
              data-rule-set-id="${ruleSet.id}"
            >
              Delete
            </button>
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

      <section class="definition-list-shell">
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

const deliverableColumns = [
  {
    key: "code",
    label: "Code",
    filterKind: "text",
    getDisplayValue: (deliverable) => deliverable.code,
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
        key: "ruleSetId",
        label: "Lifecycle Stages",
        options: getRuleSetOptions(project.id),
        placeholderLabel: getRuleSets(project.id).length
          ? "Select a lifecycle stage set"
          : "Add a lifecycle stage set first",
        required: true,
        disabled: !getRuleSets(project.id).length,
      })}
      ${renderDeliverableSelectField({
        key: "phaseId",
        label: "Phase",
        options: getDefinitionOptions("phases", project.id),
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
  const { filters, sortBy, sortDirection } = deliverablesTableState;

  const filteredDeliverables = allDeliverables.filter((deliverable) =>
    deliverableColumns.every((column) => {
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
    deliverableColumns.find((column) => column.key === sortBy) ?? deliverableColumns[0];

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
  const hasFilters = Object.values(deliverablesTableState.filters).some(Boolean);

  return `
    <div class="deliverables-table-head">
      <div class="definition-list-head">
        <p class="definition-list-title">Deliverables</p>
        <span class="definition-list-count">${allDeliverables.length}</span>
      </div>
      <button
        class="primary-button"
        type="button"
        data-action="open-deliverable-modal"
      >
        Create deliverable
      </button>
    </div>
    <div class="deliverables-table-wrap">
      <table class="deliverables-table">
        <thead>
          <tr>
            ${deliverableColumns
              .map((column) => {
                const isActiveSort = deliverablesTableState.sortBy === column.key;
                const sortIndicator = isActiveSort
                  ? deliverablesTableState.sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : "↕";

                return `
                  <th scope="col" aria-sort="${isActiveSort ? (deliverablesTableState.sortDirection === "asc" ? "ascending" : "descending") : "none"}">
                    <button
                      class="deliverables-sort-button"
                      type="button"
                      data-action="sort-deliverables"
                      data-sort-key="${column.key}"
                    >
                      <span>${escapeHtml(column.label)}</span>
                      <span class="deliverables-sort-indicator" aria-hidden="true">${sortIndicator}</span>
                    </button>
                  </th>
                `;
              })
              .join("")}
          </tr>
          <tr class="deliverables-filter-row">
            ${deliverableColumns
              .map((column) => `
                <th scope="col">
                  ${
                    column.filterKind === "text"
                      ? `
                        <input
                          class="deliverables-filter-control"
                          type="search"
                          data-deliverable-filter="${column.key}"
                          value="${escapeHtml(deliverablesTableState.filters[column.key])}"
                          placeholder="Filter ${escapeHtml(column.label.toLowerCase())}"
                          autocomplete="off"
                        />
                      `
                      : `
                        <select
                          class="deliverables-filter-control"
                          data-deliverable-filter="${column.key}"
                        >
                          ${renderSelectOptions(
                            column.getFilterOptions(project.id),
                            deliverablesTableState.filters[column.key],
                            `Any ${column.label.toLowerCase()}`,
                          )}
                        </select>
                      `
                  }
                </th>
              `)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${
            filteredDeliverables.length
              ? filteredDeliverables
                  .map(
                    (deliverable) => `
                      <tr>
                        ${deliverableColumns
                          .map(
                            (column) => `
                              <td>${escapeHtml(getDeliverableColumnDisplayValue(column, deliverable, project.id))}</td>
                            `,
                          )
                          .join("")}
                      </tr>
                    `,
                  )
                  .join("")
              : `
                  <tr>
                    <td class="deliverables-empty-cell" colspan="${deliverableColumns.length}">
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

      <section class="definition-list-shell" id="deliverablesTableSection">
        ${renderDeliverablesTableSection(project)}
      </section>
    </section>
  `;
};

const renderProjectEditorBody = () => {
  const project = projectEditorProjectId ? findProjectById(projectEditorProjectId) : null;
  const isEditing = Boolean(project);
  const canDelete = projects.length > 1;

  return `
  <form class="project-form" id="projectForm" ${isEditing ? `data-project-id="${project.id}"` : ""}>
    <div class="form-row">
      <label class="field">
        <span>Project name</span>
        <input
          type="text"
          data-project-field="name"
          placeholder="North River Upgrade"
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
          placeholder="NRU-01"
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
    body: (project) => renderDefinitionBody("types", project),
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
        ? "Update the selected project's name, code, or status. Deletion removes its project-scoped definitions and deliverables."
        : "Create a project record first, then define its phases, WBS items, packages, roles, members, deliverable types, and lifecycle stages.",
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

const validateProjectValues = ({ name, code }, excludingId = null) => {
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

  return {
    payload: {
      name,
      code,
    },
  };
};

const renderView = () => {
  if (currentView !== "deliverables") {
    closeDeliverableModal({ restoreFocus: false });
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
  bindViewInteractions();
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 760) {
    sidebar.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
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
  activeProjectName.textContent = currentProject.name;
  activeProjectCode.textContent = getProjectMetaLabel(currentProject);

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

const bindDefinitionForm = (form, view) => {
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

    const itemId = form.dataset.itemId ?? null;
    const validation = validateDefinitionForm(form, view, currentProject.id, itemId);

    if (!("payload" in validation)) {
      const field = form.querySelector(`[data-definition-field="${validation.field}"]`);
      showFieldError(field, validation.message);
      return;
    }

    const items = getDefinitionItems(view, currentProject.id);

    if (itemId) {
      const item = items.find((entry) => entry.id === itemId);

      if (!item) {
        return;
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
  });
};

const bindDefinitionView = (view) => {
  const form = document.getElementById("definitionForm");
  const inlineEditForm = document.getElementById("definitionInlineEditForm");
  const cancelButton = workspaceBody.querySelector('[data-action="cancel-definition-edit"]');
  const editButtons = workspaceBody.querySelectorAll('[data-action="edit-definition"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-definition"]');

  if (!form && !inlineEditForm) return;

  bindDefinitionForm(form, view);
  bindDefinitionForm(inlineEditForm, view);

  cancelButton?.addEventListener("click", () => {
    editingDefinition = {
      view: null,
      itemId: null,
    };
    renderView();
  });

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

const bindRuleSetView = () => {
  const createForm = document.getElementById("ruleSetCreateForm");
  const inlineEditForm = document.getElementById("ruleSetInlineEditForm");
  const cancelButton = workspaceBody.querySelector('[data-action="cancel-rule-set-edit"]');
  const editButtons = workspaceBody.querySelectorAll('[data-action="edit-rule-set"]');
  const deleteButtons = workspaceBody.querySelectorAll('[data-action="delete-rule-set"]');

  if (!createForm && !inlineEditForm) return;

  const bindRuleSetForm = (form) => {
    if (!form) return;

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

      const ruleSetId = form.dataset.ruleSetId ?? null;
      const validation = validateRuleSetForm(form, currentProject.id, ruleSetId);

      if (!("payload" in validation)) {
        showFieldError(validation.field, validation.message);
        return;
      }

      if (ruleSetId) {
        const ruleSet = getRuleSets(currentProject.id).find((item) => item.id === ruleSetId);

        if (!ruleSet) {
          return;
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
    });

    updateStageRowState();
  };

  bindRuleSetForm(createForm);
  bindRuleSetForm(inlineEditForm);

  cancelButton?.addEventListener("click", () => {
    editingRuleSetId = null;
    renderView();
  });

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
  ruleSetId: form.querySelector('[data-deliverable-field="ruleSetId"]')?.value.trim() ?? "",
  phaseId: form.querySelector('[data-deliverable-field="phaseId"]')?.value.trim() ?? "",
  wbsId: form.querySelector('[data-deliverable-field="wbsId"]')?.value.trim() ?? "",
  packageId: form.querySelector('[data-deliverable-field="packageId"]')?.value.trim() ?? "",
});

const validateDeliverableForm = (form, projectId) => {
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
      (deliverable) => normalizeValue(deliverable.code) === normalizeValue(values.code),
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

  if (!findRuleSet(projectId, values.ruleSetId)) {
    return {
      field: "ruleSetId",
      message: "Choose a valid lifecycle stage set.",
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

  return {
    payload: {
      code: values.code,
      typeId: values.typeId,
      ruleSetId: values.ruleSetId,
      phaseId: values.phaseId,
      wbsId: values.wbsId,
      packageId: values.packageId || null,
    },
  };
};

const bindDeliverablesTableControls = () => {
  const sortButtons = workspaceBody.querySelectorAll('[data-action="sort-deliverables"]');
  const filterControls = workspaceBody.querySelectorAll("[data-deliverable-filter]");

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
};

const updateDeliverablesTableSection = ({ focusFilterKey = null } = {}) => {
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
  bindDeliverablesView();

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

const bindDeliverableForm = (form) => {
  if (!form) {
    return;
  }

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

    const validation = validateDeliverableForm(form, currentProject.id);

    if (!("payload" in validation)) {
      const field = form.querySelector(`[data-deliverable-field="${validation.field}"]`);
      showFieldError(field, validation.message);
      return;
    }

    getDeliverables(currentProject.id).push(
      createProjectScopedEntity(currentProject.id, validation.payload),
    );
    closeDeliverableModal();
    updateDeliverablesTableSection();
  });
};

const bindDeliverableModal = () => {
  const form = deliverableModal.querySelector("#deliverableForm");
  const closeButtons = deliverableModal.querySelectorAll('[data-action="cancel-deliverable-modal"]');

  bindDeliverableForm(form);

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeDeliverableModal();
    });
  });
};

const bindDeliverablesView = () => {
  const openButton = workspaceBody.querySelector('[data-action="open-deliverable-modal"]');

  bindDeliverablesTableControls();

  openButton?.addEventListener("click", () => {
    openDeliverableModal();
  });
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
    const statusInput = form.querySelector('[data-project-field="status"]');
    const name = nameInput?.value.trim() ?? "";
    const code = codeInput?.value.trim() ?? "";
    const archived = statusInput?.value === "archived";
    const validation = validateProjectValues({ name, code }, editingProjectId);

    if (!("payload" in validation)) {
      const field =
        validation.field === "name"
          ? nameInput
          : validation.field === "code"
            ? codeInput
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
        id: buildProjectId(name),
        ...validation.payload,
        archived,
      };

      projects = [...projects, project];
      projectStateStore[project.id] = createProjectState();
      currentProject = project;
      resetDeliverablesTableState();
    }

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
  if (currentView === "deliverables") {
    bindDeliverablesView();
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

menuToggle.setAttribute("aria-expanded", "false");

menuToggle.addEventListener("click", () => {
  const nextState = !sidebar.classList.contains("is-open");
  sidebar.classList.toggle("is-open", nextState);
  menuToggle.setAttribute("aria-expanded", String(nextState));
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

renderProjectOptions();
syncProjectSelection();
renderView();
