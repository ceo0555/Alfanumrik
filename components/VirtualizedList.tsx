import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    emptyMessage?: string;
    className?: string;
}

function VirtualizedList<T>({ 
    items, 
    itemHeight, 
    renderItem, 
    emptyMessage = 'No items to display',
    className = ''
}: VirtualizedListProps<T>) {
    if (items.length === 0) {
        return (
            <div className={`flex items-center justify-center p-12 text-slate-500 ${className}`}>
                <div className="text-center">
                    <p className="text-lg">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
            {renderItem(items[index], index)}
        </div>
    );

    return (
        <div className={`${className}`} style={{ height: '100%', minHeight: '400px' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        itemCount={items.length}
                        itemSize={itemHeight}
                        width={width}
                        overscanCount={5}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}

export default VirtualizedList;
