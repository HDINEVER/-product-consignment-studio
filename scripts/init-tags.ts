/**
 * 初始化 Tags Collection 数据
 * 
 * 注意: 这个脚本需要 Appwrite Server SDK (node-appwrite)
 * 目前项目使用的是浏览器端SDK，因此暂时无法运行此脚本
 * 
 * 替代方案: 手动在 Appwrite Console 中创建初始数据
 * 或者使用下面的 REST API 脚本
 */

/* 
=============================================================================
手动初始化步骤 (推荐):
=============================================================================

1. 访问 Appwrite Console
2. 进入 product_consignment_db > tags collection
3. 点击 "Add Document" 
4. 按照以下格式添加文档:

** 分类标签 (Categories) **
{ "type": "category", "name": "纸制品", "order": 1 }
{ "type": "category", "name": "3D打印制品", "order": 2 }
{ "type": "category", "name": "角色手办定制", "order": 3 }
{ "type": "category", "name": "吧唧制品", "order": 4 }
{ "type": "category", "name": "雪弗板定制", "order": 5 }
{ "type": "category", "name": "Cos道具/3D代打", "order": 6 }

** IP标签 (IPs) **
{ "type": "ip", "name": "原神", "order": 1 }
{ "type": "ip", "name": "崩坏：星穹铁道", "order": 2 }
{ "type": "ip", "name": "初音未来", "order": 3 }
{ "type": "ip", "name": "明日方舟", "order": 4 }
{ "type": "ip", "name": "排球少年", "order": 5 }
{ "type": "ip", "name": "蓝色监狱", "order": 6 }
{ "type": "ip", "name": "原创/其他", "order": 7 }

=============================================================================
*/

console.log('此脚本需要 node-appwrite SDK');
console.log('请参考上方注释中的手动初始化步骤');
console.log('或者访问 TAGS_SETUP.md 查看详细说明');

