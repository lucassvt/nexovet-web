"use client"

import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

type Category = HttpTypes.StoreProductCategory & {
  category_children?: HttpTypes.StoreProductCategory[]
}

type CategoryTreeProps = {
  categories: Category[]
  currentHandle?: string
  onSelect: (handle: string | null) => void
}

type NodeProps = {
  node: Category
  currentHandle?: string
  onSelect: (handle: string | null) => void
  depth: number
}

const CategoryNode = ({ node, currentHandle, onSelect, depth }: NodeProps) => {
  const hasChildren = !!(node.category_children && node.category_children.length)
  const isCurrent = currentHandle === node.handle
  const [expanded, setExpanded] = useState<boolean>(
    hasChildren && (isCurrent || depth === 0)
  )

  return (
    <li>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 10}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Colapsar" : "Expandir"}
            onClick={() => setExpanded(!expanded)}
            className="h-5 w-5 flex items-center justify-center text-gray-500 hover:text-[#f6a906]"
          >
            <svg
              aria-hidden="true"
              className={`h-3 w-3 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className="h-5 w-5" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => onSelect(isCurrent ? null : node.handle)}
          className={`flex-1 text-left py-1 text-sm font-montserrat transition ${
            isCurrent
              ? "font-semibold text-[#f6a906]"
              : "text-[#0d1816] hover:text-[#f6a906]"
          }`}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="mt-1">
          {node.category_children!.map((child) => (
            <CategoryNode
              key={child.id}
              node={child as Category}
              currentHandle={currentHandle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

const CategoryTree = ({
  categories,
  currentHandle,
  onSelect,
}: CategoryTreeProps) => {
  // Only show the root level here; children are rendered recursively.
  const roots = categories.filter(
    (c) => !c.parent_category_id && !(c as any).parent_category
  )

  if (!roots.length) {
    return (
      <p className="text-xs text-gray-500 font-montserrat">
        No hay categorias disponibles.
      </p>
    )
  }

  return (
    <ul className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
      {roots.map((node) => (
        <CategoryNode
          key={node.id}
          node={node}
          currentHandle={currentHandle}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </ul>
  )
}

export default CategoryTree
