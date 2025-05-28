<template>
    <div class="w-full h-full relative bg-gray-100">
      <svg ref="svgRef" class="w-full h-full"></svg>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import * as d3 from 'd3'
  
  const props = defineProps({
    data: Object
  })
  
  const svgRef = ref(null)
  
  const renderTree = () => {
    const svgElement = svgRef.value
    if (!svgElement || !props.data) return
  
    const width = svgElement.clientWidth
    const height = svgElement.clientHeight
    const radius = Math.min(width, height) / 2 - 100
  
    const svg = d3.select(svgElement)
    svg.selectAll('*').remove() // Clear previous
  
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)
  
    const root = d3.hierarchy(props.data)
    const tree = d3.tree().size([2 * Math.PI, radius])
    tree(root)
  
    // Links
    g.selectAll('path.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1') // slate-300
      .attr('stroke-width', 2)
      .attr('d', d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
      )
  
    // Nodes
    const node = g.selectAll('g.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node group')
      .attr('transform', d => `
        rotate(${(d.x * 180 / Math.PI - 90)})
        translate(${d.y},0)
      `)
  
    node.append('circle')
      .attr('r', 6)
      .attr('fill', d => d.children ? '#3b82f6' : '#10b981') // blue or green
  
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI === !d.children ? 10 : -10)
      .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .text(d => d.data.data?.Name || d.data.name || '')
      .attr('font-size', 14)
      .attr('font-family', 'sans-serif')
      .attr('fill', '#1e293b') // slate-800
      .style('cursor', 'pointer')
      .style('user-select', 'none')
  
    // Optional: Add job titles or stats on hover
    node.append('title')
      .text(d => {
        const stats = d.data.data?.stats
        const title = d.data.data?.['Job Title']
        if (!stats) return title || ''
        return [
          title,
          `👥 Descendants: ${stats.totalDescendants}`,
          `🌿 Non-leaf: ${stats.nonLeafDescendants}`,
          `💰 IC Cost: $${stats.icCost.toLocaleString()}`,
          `🧑‍💼 Mgmt Cost: $${stats.managementCost.toLocaleString()}`,
          `📊 Total Cost: $${stats.totalCost.toLocaleString()}`,
          `⚖️ Ratio: ${(
            stats.icCost / (stats.managementCost || 1)
          ).toFixed(2)}`
        ].join('\n')
      })
  }
  
  onMounted(() => {
    renderTree()
    window.addEventListener('resize', renderTree)
  })
  
  watch(() => props.data, () => {
    renderTree()
  })
  </script>
  
  <style scoped>
  svg {
    width: 100%;
    height: 100%;
  }
  .link {
    transition: all 0.3s ease;
  }
  .node circle {
    transition: fill 0.3s ease;
  }
  .node:hover circle {
    fill: #2563eb; /* hover to a darker blue */
  }
  </style>
  