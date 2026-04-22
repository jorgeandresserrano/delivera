# Delivera - Deliverable Lifecycle Tracking Tool

## Overview

Delivera is a compact, data-dense internal application for tracking the lifecycle of deliverables within a project.

This is a working tool, not a presentation app. The UI must maximize information density, minimize wasted space, and support fast scanning and fast editing.

The purpose of the app is to follow each deliverable through its lifecycle stages, focusing on:

- current stage
- expected dates
- actual completion dates
- assignment status
- follow-up notes
- history of changes

The app does not track hours, effort, or timesheets.

---

## Project-Centered Data Model

### Projects

All business data in Delivera belongs to a Project.

Each project has:

- required name
- optional code
- archive state

Important rule:

- business master data is project-scoped
- nothing is reused across projects
- every definition, member, and deliverable exists inside exactly one project
- project data is never shared across projects

---

## Core Concepts

### Deliverables

Each deliverable represents a unit of work inside a project.

Each deliverable must belong to:

- a Project
- a Deliverable Type
- a Project Phase
- a Lifecycle Stage Set
- a WBS item
- a Construction Package

Each deliverable must also have:

- a business code
- assigned project members
- stage-by-stage expected dates
- stage-by-stage actual completion dates
- follow-up comments
- full audit history

Important decisions:

- the deliverable code is the only business identifier in v1
- the code must be unique within a project
- deliverables do not have a separate title/name in v1
- current stage is derived from the deliverable's stage records rather than stored as a duplicate field

Because deliverable type and its assigned lifecycle stage set drive stage and assignment instantiation, they are creation-time structural choices and should be treated as fixed after creation in v1.

---

## Deliverable Types

Deliverable types are fully configurable within each project.

Examples:

- Engineering drawings
- 3D steel models
- Calculation briefs

Deliverable types also define the assignment role templates used when a deliverable is created.

Each deliverable type must also define the lifecycle stage set that will be used for every deliverable of that type.

Each deliverable type can include multiple role rows.

Each assignment template row on a deliverable type defines:

- one role

Each deliverable type also defines:

- one lifecycle stage set

Important rule:

- each role may appear only once per deliverable type

---

## Project Phases

Project phases are fully configurable within each project.

Examples:

- MTO quantities production
- Feasibility
- Detailed engineering

Project phase is informational and useful for filtering, reporting, and grouping.

Important rule:

- project phase does not determine or constrain the lifecycle stage set assigned to a deliverable

---

## Lifecycle Stages

A Lifecycle Stage Set is a reusable project-scoped template that defines an ordered sequence of stages.

Each lifecycle stage set:

- belongs to a project
- is assigned on the deliverable type and inherited by deliverables created from that type
- contains multiple stages
- does not contain any dates

### Stages Within a Lifecycle Stage Set

Each stage defines:

- name
- order
- optional description

These stages are pure templates.

Important rule:

- lifecycle stage sets are reusable within a project
- editing a lifecycle stage set should affect future deliverables, not rewrite historical deliverable-stage snapshots that were already instantiated

---

## Critical Design Rule

Dates must never be stored on the lifecycle stage definition.

Instead:

- each deliverable instantiates its own stage records from the lifecycle stage set assigned by its type
- each deliverable-stage record stores:
  - expected due date
  - actual completion date
  - explicit status

This requires two separate concepts:

- `LifecycleStageTemplate`: template stage
- `DeliverableStage`: per-deliverable stage instance

Each deliverable stage must snapshot the template values needed for history:

- stage order
- stage name
- optional description

Stage status in v1 is explicit:

- pending
- in_progress
- completed
- skipped

Important rule:

- only one stage may be `in_progress` for a deliverable at a time
- a completed stage must have an actual completion date
- non-completed stages must not have an actual completion date

---

## WBS (Work Breakdown Structure)

WBS items are defined in the project definitions section.

Each WBS item includes:

- code
- name

WBS code must be unique within a project.

---

## Construction Packages

Deliverables must belong to a Construction Package defined within the project.

Each package includes:

- code
- optional name

Construction package code must be unique within a project.

---

## Team Assignment

Assignments are driven by configurable role templates on the deliverable type.

That means:

- roles are not hardcoded in the schema
- each deliverable type defines its own required assignment slots
- when a deliverable is created, those role templates are instantiated onto the deliverable as assignment rows
- the creator selects one project member for each required role when creating the deliverable
- assignment rows snapshot the role key, label, and order so later template changes do not rewrite existing deliverables

Example role templates:

- drawings / models:
  - production technician
  - CAD checker
  - engineer of record
- calculation briefs:
  - engineer
  - engineering checker

These are examples only. The system must remain configurable.

Assignments use project-scoped roles and project-scoped members. A deliverable can only reference members that belong to the same project.

Important rule:

- member definitions do not carry a fixed role
- roles are applied through deliverable assignment requirements, not on the member record itself

---

## Comments / Follow-Up

Each deliverable has a general follow-up section.

This is a chronological log, not a single text field.

Each comment includes:

- timestamp
- author
- text content

Comments are append-oriented and should preserve history.

---

## History / Audit Trail

The system must track important changes at the database level.

The audit trail must cover:

- insertions
- updates
- deletions where allowed
- stage status changes
- expected date changes
- actual date changes
- assignment changes
- key field updates on deliverables and definition records

Each audit entry should include:

- entity/table
- record identifier
- action
- changed field for updates
- old value
- new value
- timestamp
- user
- grouped change-set identifier

Audit history is immutable and must not be blocked by later deletion or archiving of business records.

---

## Permissions & Authentication

The app must be protected by login.

Permissions in v1 are intentionally simple:

- `owner`: full create, edit, archive, and delete access where allowed
- `viewer`: read-only access

Authentication can remain separate, but assignment members in the business model are project-scoped and are not shared across projects.

---

## Definitions Section

There must be a dedicated section to manage project master data:

- Deliverable Types
- Deliverable Type Assignment Roles
- Project Phases
- WBS items
- Construction Packages
- Lifecycle Stage Sets
- Stages within each set

No business data is hardcoded.

Definitions are project-scoped and should support archiving.

---

## Lifecycle Behavior

Creating a deliverable must be a single transactional operation.

When a deliverable is created, the system must:

1. create the deliverable row
2. instantiate deliverable stages from the lifecycle stage set assigned by the selected deliverable type
3. instantiate deliverable assignments from the selected deliverable type's role templates
4. mark the first stage as `in_progress`
5. write audit entries for the created records

This ensures the operational state always starts from a complete and consistent structure.

---

## Data Model (Conceptual)

### Project-Scoped Definitions

- Project
- DeliverableType
- DeliverableTypeRoleTemplate
- ProjectPhase
- WBSItem
- ConstructionPackage
- Role
- Member
- LifecycleStageSet
- LifecycleStageTemplate

### Operational

- Deliverable
- DeliverableStage
- DeliverableAssignment
- DeliverableComment
- AuditLog

Important rule:

- operational records are project-scoped through their parent deliverable
- no business record exists outside a project container

---

## Data Retention and Deletion

Deliverables and definition records should support archiving.

Important rule:

- if a record is already referenced operationally, prefer archive over hard delete
- hard delete should only be allowed for unused setup records
- operational history must be preserved

---

## UI Requirements

The UI must be:

- compact
- high information density
- minimal in padding and spacing
- optimized for fast scanning and editing
- table/grid-based where appropriate
- low-click for updating dates or stage status

This is an internal operations tool, so usability and density matter more than presentation polish.

---

## Final Summary

Delivera is a secure, relational, project-based application where:

- all business master data is configurable and project-scoped
- each deliverable belongs to a project, type, phase, WBS item, construction package, and a lifecycle stage set derived from its type at creation time
- no definitions, members, or deliverables are shared across projects
- lifecycle stage sets define ordered stage templates and never store dates
- each deliverable owns instantiated stage records with expected dates, actual dates, and explicit status
- the current stage is derived from those stage records
- assignment roles are configurable per deliverable type and instantiated as project-member assignments per deliverable
- follow-up comments are logged chronologically
- a full audit trail captures important changes over time
- users are authenticated through a single users model with simple owner/viewer permissions
- the UI is compact and optimized as a dense working tool
