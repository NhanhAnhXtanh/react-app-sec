import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Type, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FieldItem } from '@/model/metasync.types';

type Props = {
  value?: string | null;
  onChange?: (value: string) => void;
  readOnly?: boolean;
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const DATA_TYPES = [
  {
    group: 'Cơ bản (Primitives & Wrappers)',
    items: [
      { value: 'String', label: 'String java.lang' },
      { value: 'Integer', label: 'Integer java.lang' },
      { value: 'Long', label: 'Long java.lang' },
      { value: 'Double', label: 'Double java.lang' },
      { value: 'Float', label: 'Float java.lang' },
      { value: 'Boolean', label: 'Boolean java.lang' },
      { value: 'Short', label: 'Short java.lang' },
      { value: 'Byte', label: 'Byte java.lang' },
      { value: 'BigDecimal', label: 'BigDecimal java.math' },
      { value: 'short', label: 'short' },
      { value: 'long', label: 'long' },
    ]
  },
  {
    group: 'Thời gian (Date/Time)',
    items: [
      { value: 'Instant', label: 'Instant java.time' },
      { value: 'LocalDateTime', label: 'LocalDateTime java.time' },
      { value: 'LocalDate', label: 'LocalDate java.time' },
      { value: 'LocalTime', label: 'LocalTime java.time' },
      { value: 'OffsetDateTime', label: 'OffsetDateTime java.time' },
      { value: 'ZonedDateTime', label: 'ZonedDateTime java.time' },
      { value: 'ZoneOffset', label: 'ZoneOffset java.time' },
    ]
  },
  {
    group: 'Mảng & Khác (Arrays/Special)',
    items: [
      { value: 'byte[]', label: 'byte[]' },
      { value: 'char[]', label: 'char[]' },
      { value: 'InetAddress', label: 'InetAddress java.net' },
      { value: 'Geometry org.geolatte.geom', label: 'Geometry org.geolatte.geom' },
      { value: 'Geometry com.vividsolutions.jts.geom', label: 'Geometry com.vividsolutions.jts.geom' },
      { value: 'UUID', label: 'UUID java.util' },
    ]
  }
];

export function FieldDataEditor({ value, onChange, readOnly = false }: Props) {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Initialize or sync from value prop
  useEffect(() => {
    if (!value) {
      if (fields.length > 0) setFields([]);
      return;
    }

    if (readOnly) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const items = parsed.map((f: any) => ({ ...f, id: f.id || generateId() }));
          setFields(items);
        }
      } catch (e) {
        // Ignore
      }
      return;
    }

    // Edit mode: only init if empty to avoid overwriting user edits
    if (fields.length === 0) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const items = parsed.map((f: any) => ({ ...f, id: f.id || generateId() }));
          setFields(items);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [value, readOnly]); // Note: intentional omission of fields.length to avoid loops

  const notifyChange = (newFields: FieldItem[]) => {
    setFields(newFields);
    onChange?.(JSON.stringify(newFields, null, 2));
  };

  const handleAddSibling = () => {
    const parentField = fields.find(f => f.id === selectedId);
    let pathParent = null;
    
    if (parentField) {
      pathParent = parentField.path_parent;
    } else {
      // If nothing is selected, infer the root path_parent from existing root fields
      const rootFields = fields.filter(f => !f.path_parent || !fields.some(p => p.path === f.path_parent));
      if (rootFields.length > 0) {
        pathParent = rootFields[0].path_parent;
      }
    }
    
    let baseName = 'newField';

    const newField: FieldItem = {
      id: generateId(),
      code: baseName,
      name: 'Trường mới',
      dataType: 'String',
      path: pathParent ? `${pathParent}.${baseName}` : baseName,
      path_parent: pathParent,
      description: '',
      isNull: true,
      isPrimaryKey: false,
      comment: '',
    };

    notifyChange([...fields, newField]);
    setSelectedId(newField.id);
  };

  const handleAddChild = (parentId: string) => {
    const parentField = fields.find(f => f.id === parentId);
    if (!parentField) return;
    const pathParent = parentField.path;
    let baseName = 'newField';

    setExpandedIds(prev => new Set(prev).add(parentId));

    const newField: FieldItem = {
      id: generateId(),
      code: baseName,
      name: 'Trường con',
      dataType: 'String',
      path: `${pathParent}.${baseName}`,
      path_parent: pathParent,
      description: '',
      isNull: true,
      isPrimaryKey: false,
      comment: '',
    };

    notifyChange([...fields, newField]);
    setSelectedId(newField.id);
  };

  const handleDeleteField = () => {
    if (!selectedId) return;
    const fieldToDelete = fields.find(f => f.id === selectedId);
    if (!fieldToDelete) return;

    // Delete field and all descendants
    const pathsToDelete = [fieldToDelete.path];
    const descendants = fields.filter(f => f.path.startsWith(fieldToDelete.path + '.'));
    pathsToDelete.push(...descendants.map(f => f.path));

    const newFields = fields.filter(f => !pathsToDelete.includes(f.path));
    notifyChange(newFields);
    setSelectedId(null);
  };

  const updateSelectedField = (updates: Partial<FieldItem>) => {
    if (!selectedId) return;
    const oldField = fields.find(f => f.id === selectedId);
    if (!oldField) return;

    // If code changes, we need to update path and children's paths
    let newFields = [...fields];
    
    if (updates.code && updates.code !== oldField.code) {
      const newPath = oldField.path_parent ? `${oldField.path_parent}.${updates.code}` : updates.code;
      const oldPathPrefix = oldField.path + '.';
      const newPathPrefix = newPath + '.';

      newFields = newFields.map(f => {
        if (f.id === selectedId) {
          return { ...f, ...updates, path: newPath };
        }
        if (f.path.startsWith(oldPathPrefix)) {
          const suffix = f.path.substring(oldPathPrefix.length);
          const childNewPath = newPathPrefix + suffix;
          const childNewPathParent = f.path_parent === oldField.path ? newPath : f.path_parent?.replace(oldPathPrefix, newPathPrefix) || null;
          return { ...f, path: childNewPath, path_parent: childNewPathParent };
        }
        return f;
      });
    } else {
      newFields = newFields.map(f => f.id === selectedId ? { ...f, ...updates } : f);
    }

    notifyChange(newFields);
  };

  const selectedField = fields.find(f => f.id === selectedId);

  // Build tree structure for rendering
  const rootFields = fields.filter(f => !f.path_parent || !fields.some(p => p.path === f.path_parent));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = (items: FieldItem[], level = 0) => {
    return items.map(item => {
      const children = fields.filter(f => f.path_parent === item.path);
      const isExpanded = expandedIds.has(item.id);
      const isSelected = selectedId === item.id;
      const allTypes = DATA_TYPES.flatMap(g => g.items);
      const typeDef = allTypes.find(t => t.value === item.dataType);
      const Icon = (item.dataType === 'Object' || item.dataType === 'Array') ? Box : Type;

      return (
        <div key={item.id} className="w-full">
          <div
            className={`flex cursor-pointer items-center gap-2 border-b border-border px-2 py-2 text-sm hover:bg-muted/50 ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => setSelectedId(item.id)}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              {children.length > 0 && (
                <button type="button" onClick={(e) => toggleExpand(item.id, e)} className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
            <Icon size={14} className="text-muted-foreground" />
            <span className="font-medium text-foreground">{item.code}</span>
            <span className="text-muted-foreground">{item.name}</span>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-normal">
                {item.dataType === 'Object' ? 'Object' : item.dataType === 'Array' ? 'Array' : (typeDef?.label || item.dataType)}
              </Badge>
              {item.isPrimaryKey && <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px]">PK</Badge>}
            </div>
          </div>
          {isExpanded && children.length > 0 && (
            <div>{renderTree(children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full min-h-[600px] w-full overflow-hidden rounded-md border border-border">
      {/* LEFT PANEL - TREE */}
      <div className="flex w-1/2 flex-col border-r border-border bg-background">
        {!readOnly && (
          <div className="flex items-center justify-end gap-2 border-b border-border p-2 bg-muted/20">
            <Button type="button" variant="outline" size="sm" onClick={handleAddSibling} className="h-8">
              <Plus className="mr-1 h-4 w-4" /> Thêm
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => selectedId && handleAddChild(selectedId)} 
              disabled={!selectedId || (selectedField?.dataType !== 'Object' && selectedField?.dataType !== 'Array')} 
              className="h-8"
            >
              <Box className="mr-1 h-4 w-4" /> Thêm trường con
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeleteField} disabled={!selectedId} className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="mr-1 h-4 w-4" /> Xóa
            </Button>
          </div>
        )}
        <ScrollArea className="flex-1">
          {fields.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có trường dữ liệu nào. Bấm "Thêm" để bắt đầu cấu hình.
            </div>
          ) : (
            <div className="flex flex-col">
              {renderTree(rootFields)}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex w-1/2 flex-col bg-muted/5">
        <div className="border-b border-border p-2 bg-muted/20">
          <div className="flex gap-4 px-2 py-1 text-sm font-medium">
            <span className="border-b-2 border-primary text-primary pb-1">Chi tiết trường</span>
          </div>
        </div>
        <ScrollArea className="flex-1 p-6">
          {!selectedField ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Chọn một trường bên trái để xem chi tiết
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold">{selectedField.name || 'Chi tiết trường dữ liệu'}</h3>
              
              <div className="grid gap-2">
                <Label>Tên hiển thị</Label>
                <Input
                  value={selectedField.name}
                  onChange={e => updateSelectedField({ name: e.target.value })}
                  placeholder="Ví dụ: Ngày cấp"
                  disabled={readOnly}
                />
              </div>

              <div className="grid gap-2">
                <Label>Mã trường (Code)</Label>
                <Input
                  value={selectedField.code}
                  onChange={e => updateSelectedField({ code: e.target.value })}
                  className="font-mono"
                  disabled={readOnly}
                />
              </div>

              <div className="grid gap-2">
                <Label>Đường dẫn (Path)</Label>
                <Input
                  value={selectedField.path}
                  disabled
                  className="font-mono bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label>Cấu trúc</Label>
                <Select
                  value={
                    selectedField.dataType === 'Object' ? 'Object' :
                    selectedField.dataType === 'Array' ? 'Array' : 'Primitive'
                  }
                  onValueChange={v => {
                    if (v === 'Object') updateSelectedField({ dataType: 'Object' });
                    else if (v === 'Array') updateSelectedField({ dataType: 'Array' });
                    else updateSelectedField({ dataType: 'String' });
                  }}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primitive">Dữ liệu nguyên thuỷ (Primitive)</SelectItem>
                    <SelectItem value="Object">Đối tượng (Object)</SelectItem>
                    <SelectItem value="Array">Mảng (Array)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedField.dataType !== 'Object' && selectedField.dataType !== 'Array' && (
                <div className="grid gap-2">
                  <Label>Kiểu dữ liệu chi tiết</Label>
                  <Select
                    value={selectedField.dataType}
                    onValueChange={v => updateSelectedField({ dataType: v })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map((group, idx) => (
                        <div key={group.group}>
                          <SelectGroup>
                            <SelectLabel>{group.group}</SelectLabel>
                            {group.items.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectGroup>
                          {idx < DATA_TYPES.length - 1 && <SelectSeparator />}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Mô tả / Ghi chú</Label>
                <Input
                  value={selectedField.comment || ''}
                  onChange={e => updateSelectedField({ comment: e.target.value })}
                  placeholder="Ghi chú thêm về trường dữ liệu này..."
                  disabled={readOnly}
                />
              </div>

              <div className="flex gap-8 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPrimaryKey"
                    checked={selectedField.isPrimaryKey}
                    onCheckedChange={v => updateSelectedField({ isPrimaryKey: v })}
                    disabled={readOnly}
                  />
                  <Label htmlFor="isPrimaryKey" className={readOnly ? 'opacity-50' : 'cursor-pointer'}>Là khóa chính</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isRequired"
                    checked={!selectedField.isNull}
                    onCheckedChange={v => updateSelectedField({ isNull: !v })}
                    disabled={readOnly}
                  />
                  <Label htmlFor="isRequired" className={readOnly ? 'opacity-50' : 'cursor-pointer'}>Bắt buộc (Not Null)</Label>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
