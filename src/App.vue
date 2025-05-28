<template>
  <!-- <div>
    <RadialTree :data="data" class="h-[700px] w-full border rounded-lg shadow" />
  </div> -->
  <div class="w-screen h-screen flex flex-col bg-gray-100 overflow-hidden">
    <!-- Header controls (static) -->
    <div class="flex items-center justify-between p-4 bg-white shadow z-10">
      <div class="flex items-center space-x-4">
        <label
          class="text-lg font-semibold text-gray-700"
          for="maxChildrenInput"
        >
          Max children per node:
        </label>
        <input
          id="maxChildrenInput"
          type="number"
          min="0"
          v-model.number="maxChildren"
          class="border border-black-300 rounded-lg px-4 py-2 w-28 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white"
        />
      </div>

      <button
        @click="resetView"
        class="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition font-semibold text-lg"
      >
        Re-center
      </button>
    </div>

    <!-- Scrollable zoom/pan area -->
    <div
      class="flex-1 relative overflow-hidden cursor-default"
      @wheel.prevent="handleWheel"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
      @mouseleave="endPan"
      :class="{ 'cursor-grabbing': isPanning, 'cursor-grab': !isPanning }"
    >
      <div
        ref="zoomContainer"
        class="absolute top-0 left-0"
        :style="{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }"
      >
        <!-- Zoomable content inside the pan area -->
        <div class="min-w-max p-10">
          <OrganizationChart
            v-model:selectionKeys="selection"
            :value="filteredData"
            collapsible
            selectionMode="multiple"
            class="select-none"
          >
            <template #person="slotProps">
              <div
                @click="expandNode(slotProps.node, 1)"
                class="cursor-pointer hover:bg-blue-50 rounded-lg px-5 py-4 transition"
              >
                <div
                  class="rounded-full bg-blue-600 text-white font-extrabold w-20 h-20 flex items-center justify-center mb-3 text-3xl tracking-wide select-none"
                >
                  {{ slotProps.node.data.initials }}
                </div>
                <span class="font-semibold text-xl block text-white-900 mb-1">
                  {{ slotProps.node.data.Name }}
                </span>
                <span class="text-base text-gray-500 block">
                  {{ slotProps.node.data["Job Title"] }}
                </span>

                <div class="flex flex-col gap-2 text-sm mt-2">
                  <span
                    class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full w-fit"
                  >
                    Descendants:
                    {{ slotProps.node.data.stats?.totalDescendants ?? 0 }}
                  </span>
                  <span
                    class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full w-fit"
                  >
                    Non-leaf:
                    {{ slotProps.node.data.stats?.nonLeafDescendants ?? 0 }}
                  </span>
                  <span
                    class="bg-green-100 text-green-800 px-3 py-1 rounded-full w-fit"
                  >
                    IC Cost: ${{
                      slotProps.node.data.stats?.icCost?.toLocaleString() ?? 0
                    }}
                  </span>
                  <span
                    class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full w-fit"
                  >
                    Mgmt Cost: ${{
                      slotProps.node.data.stats?.managementCost?.toLocaleString() ??
                      0
                    }}
                  </span>
                  <span
                    class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full w-fit"
                  >
                    Total Cost: ${{
                      slotProps.node.data.stats?.totalCost?.toLocaleString() ??
                      0
                    }}
                  </span>
                  <span
                    class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full w-fit"
                  >
                    ⚖️ Ratio:
                    {{
                      slotProps.node.data.stats?.icCost &&
                      slotProps.node.data.stats?.managementCost
                        ? (
                            slotProps.node.data.stats.icCost /
                            (slotProps.node.data.stats.managementCost || 1)
                          ).toFixed(2)
                        : "N/A"
                    }}
                  </span>
                </div>

                <span
                  v-if="
                    slotProps.node._fullChildren?.length > 0 &&
                    slotProps.node.children?.length === 0
                  "
                  class="text-sm text-blue-500 mt-2 block"
                >
                  (Click to expand)
                </span>
              </div>
            </template>
          </OrganizationChart>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, computed, reactive } from "vue";
import { Graph } from "graphlib";
import Papa from "papaparse";

const zoomLevel = ref(1);
const translate = reactive({ x: 0, y: 0 });
const isPanning = ref(false);

let start = { x: 0, y: 0 };

function handleWheel(event) {
  const zoomSensitivity = 0.001;
  const newZoom = zoomLevel.value - event.deltaY * zoomSensitivity;
  zoomLevel.value = Math.min(Math.max(newZoom, 0.2), 3);
}

function startPan(event) {
  isPanning.value = true;
  start = { x: event.clientX - translate.x, y: event.clientY - translate.y };
}

function pan(event) {
  if (!isPanning.value) return;
  translate.x = event.clientX - start.x;
  translate.y = event.clientY - start.y;
}

function endPan() {
  isPanning.value = false;
}

function resetView() {
  zoomLevel.value = 1;
  translate.x = 0;
  translate.y = 0;
}

const employeeData = ref({});

// --- State ---
const selection = ref({});
// const data = ref({});
// place holder till the file can be read
const data = ref({
  key: "0",
  type: "person",
  data: { name: "Alice Johnson", title: "Chief Executive Officer" },
  children: [
    {
      key: "1",
      type: "person",
      data: { name: "Bob Smith", title: "Chief Technology Officer" },
      children: [
        {
          key: "2",
          type: "person",
          data: { name: "Carol White", title: "Engineering Manager" },
        },
        {
          key: "3",
          type: "person",
          data: { name: "David Brown", title: "QA Manager" },
        },
      ],
    },
    {
      key: "7",
      type: "person",
      data: { name: "Eve Davis", title: "Chief Financial Officer" },
      children: [
        {
          key: "8",
          type: "person",
          data: { name: "Frank Moore", title: "Finance Manager" },
        },
        {
          key: "9",
          type: "person",
          data: { name: "Grace Lee", title: "Compliance Officer" },
        },
      ],
    },
  ],
});

// this function is used to evaluate/show the chart in a lazy way
// since there are over 40k records, the whole thing can't be shown at once.
// so we show about 1 level each time and have the user click "expand more" if they
// want to see more levels of the tree

function getTreeUpToLevel(node, maxLevel, currentLevel = 1) {
  const newNode = {
    key: node.key,
    type: node.type,
    data: node.data,
    children: [],
    _fullChildren: node._fullChildren || node.children || [],
  };

  if (currentLevel < maxLevel && newNode._fullChildren.length > 0) {
    newNode.children = newNode._fullChildren.map((child) =>
      getTreeUpToLevel(child, maxLevel, currentLevel + 1)
    );
  }

  return newNode;
}

onMounted(async () => {
  const res = await fetch("/treeData.json"); // this file was created beforehand by running the createTree.js file in /scripts
  const json = await res.json();
  const fullTree = json; 

  data.value = getTreeUpToLevel(fullTree, 3);
});

function expandNode(node, currentLevel) {
  if (!node._fullChildren?.length) return;

  // Only expand children that haven't already been added
  if (!node.children || node.children.length === 0) {
    node.children = node._fullChildren.map((child) =>
      getTreeUpToLevel(child, 1, 1)
    );
  } else {
    // Recursively expand children if they have hidden children
    node.children.forEach((child, index) => {
      if (
        child._fullChildren?.length &&
        (!child.children || child.children.length === 0)
      ) {
        node.children[index] = getTreeUpToLevel(child, 1, 1);
      }
    });
  }
}

const maxChildren = ref(2); // default max children to show

// Recursive function to limit children displayed based on maxChildren
function limitChildren(node, max) {
  if (!node.children || node.children.length === 0) return node;

  // Clone node shallowly to avoid mutation
  const newNode = {
    ...node,
    children: node.children
      .slice(0, max)
      .map((child) => limitChildren(child, max)),
  };
  return newNode;
}

// Computed tree with limited children per maxChildren
const filteredData = computed(() => {
  if (!data.value) return null;
  return limitChildren(data.value, maxChildren.value);
});
</script>
