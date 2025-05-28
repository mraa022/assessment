// generateOrgTree.js

import fs from 'fs'
import Papa from 'papaparse'
import { Graph } from 'graphlib'

// --- Utility ---
function getInitials(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  return words.map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

function computeDescendantStats(node, employeeData) {
  let totalDescendants = 0;
  let nonLeafDescendants = 0;
  let managementCost = 0;
  let icCost = 0;
  let totalCost = 0;

  for (const child of node.children || []) {
    const result = computeDescendantStats(child, employeeData);

    totalDescendants += 1 + result.totalDescendants;
    nonLeafDescendants += (child.children.length > 0 ? 1 : 0) + result.nonLeafDescendants;
    managementCost += result.managementCost;
    icCost += result.icCost;
    totalCost += result.totalCost;
  }

  const ownSalary = parseFloat(employeeData[node.key]?.Salary || '0');
  totalCost += ownSalary;

  if (node.children.length > 0) {
    managementCost += ownSalary;
  } else {
    icCost += ownSalary;
  }

  node.data.stats = {
    totalDescendants,
    nonLeafDescendants,
    managementCost,
    icCost,
    totalCost,
    managementRatio: icCost > 0 ? managementCost / icCost : null,
  };

  return {
    totalDescendants,
    nonLeafDescendants,
    managementCost,
    icCost,
    totalCost,
  };
}

function buildTreeFromGraph(graph, rootId, employeeData) {
  const visited = new Set();

  const buildNode = (id) => {
    if (visited.has(id)) return null;
    visited.add(id);

    const person = employeeData[id];
    if (!person) return null;

    const children = (graph.successors(id) || [])
      .map(buildNode)
      .filter(child => child !== null);

    const node = {
      key: id,
      type: 'person',
      data: {
        Name: person.Name,
        'Job Title': person['Job Title'],
        Salary: person['Salary'],
        initials: getInitials(person.Name),
      },
      children,
    };

    return node;
  };

  const rootNode = buildNode(rootId);
  computeDescendantStats(rootNode, employeeData);
  return rootNode;
}

function createGraph(employeeData) {
  const g = new Graph();

  const ids = Object.keys(employeeData);
  for (const id of ids) {
    g.setNode(id);
  }

  for (const id of ids) {
    const person = employeeData[id];
    const manager_id = person['Manager'];
    if (manager_id && employeeData[manager_id]) {
      g.setEdge(manager_id, id);
    }
  }

  return g;
}

function findRoot(employeeData) {
  return Object.values(employeeData).find(p => !p.Manager)?.['Employee Id'];
}

// --- Main ---
fs.readFile('public/job_assesment.csv', 'utf8', (err, csvData) => {
  if (err) {
    console.error('Failed to read CSV:', err);
    return;
  }

  const parsed = Papa.parse(csvData, { header: true });
  const employeeData = {};

  for (const record of parsed.data) {
    const id = record['Employee Id'];
    if (id) {
      employeeData[id] = record;
    }
  }

  const graph = createGraph(employeeData);
  const rootId = findRoot(employeeData);
  const tree = buildTreeFromGraph(graph, rootId, employeeData);

  fs.writeFileSync('public/treeData.json', JSON.stringify(tree, null, 2), 'utf8');
  console.log('✅ Org tree saved to treeData.json');
});
