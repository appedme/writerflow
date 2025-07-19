"use client";
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { cx } from "@/src/utils";

const ResizableImage = ({ node, updateAttributes, selected }) => {
    const imageRef = useRef(null);
    const [size, setSize] = useState({
        width: node.attrs.width,
        height: node.attrs.height,
    });
    const [resizing, setResizing] = useState(false);
    const [position, setPosition] = useState(node.attrs.position || 'center');

    // Update local state when node attributes change
    useEffect(() => {
        setSize({
            width: node.attrs.width,
            height: node.attrs.height,
        });
        setPosition(node.attrs.position || 'center');
    }, [node.attrs.width, node.attrs.height, node.attrs.position]);

    // Handle image load to set initial dimensions if not already set
    const handleImageLoad = () => {
        if (!node.attrs.width || !node.attrs.height) {
            const width = imageRef.current.naturalWidth;
            const height = imageRef.current.naturalHeight;

            updateAttributes({
                width,
                height,
            });

            setSize({ width, height });
        }
    };

    // Handle resize
    const handleResize = (event, direction) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const aspectRatio = startWidth / startHeight;

        setResizing(true);

        const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault();

            let newWidth, newHeight;

            // Calculate new dimensions based on resize direction
            switch (direction) {
                case 'right':
                    newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
                    newHeight = newWidth / aspectRatio;
                    break;
                case 'bottom':
                    newHeight = Math.max(50, startHeight + (moveEvent.clientY - startY));
                    newWidth = newHeight * aspectRatio;
                    break;
                case 'bottom-right':
                    newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
                    newHeight = newWidth / aspectRatio;
                    break;
                default:
                    return;
            }

            setSize({
                width: Math.round(newWidth),
                height: Math.round(newHeight),
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Update the node attributes when resize is complete
            updateAttributes({
                width: size.width,
                height: size.height,
            });

            setResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle position change
    const changePosition = (newPosition) => {
        updateAttributes({ position: newPosition });
        setPosition(newPosition);
    };

    // Get alignment class based on position
    const getAlignmentClass = () => {
        switch (position) {
            case 'left':
                return 'float-left mr-4 my-2';
            case 'right':
                return 'float-right ml-4 my-2';
            case 'center':
            default:
                return 'mx-auto my-4 block';
        }
    };

    return (
        <NodeViewWrapper className="resizable-image-wrapper">
            <div
                className={cx(
                    "relative inline-block",
                    getAlignmentClass(),
                    selected && !resizing ? "ring-2 ring-accent" : ""
                )}
                style={{ width: size.width }}
            >
                <img
                    ref={imageRef}
                    src={node.attrs.src}
                    alt={node.attrs.alt || ''}
                    width={size.width}
                    height={size.height}
                    onLoad={handleImageLoad}
                    className="max-w-full h-auto rounded-lg"
                />

                {selected && (
                    <>
                        {/* Resize handles */}
                        <div
                            className="absolute w-3 h-3 bg-accent border border-white rounded-full right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
                            onMouseDown={(e) => handleResize(e, 'right')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-accent border border-white rounded-full bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 cursor-ns-resize"
                            onMouseDown={(e) => handleResize(e, 'bottom')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-accent border border-white rounded-full bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 cursor-nwse-resize"
                            onMouseDown={(e) => handleResize(e, 'bottom-right')}
                        />

                        {/* Position controls */}
                        <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => changePosition('left')}
                                className={cx(
                                    "p-1 rounded",
                                    position === 'left' ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700"
                                )}
                                title="Align left"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => changePosition('center')}
                                className={cx(
                                    "p-1 rounded",
                                    position === 'center' ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700"
                                )}
                                title="Align center"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => changePosition('right')}
                                className={cx(
                                    "p-1 rounded",
                                    position === 'right' ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700"
                                )}
                                title="Align right"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </NodeViewWrapper>
    );
};

export default ResizableImage;