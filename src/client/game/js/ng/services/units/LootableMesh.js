/*
    This file is part of Ironbane MMO.

    Ironbane MMO is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ironbane MMO is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ironbane MMO.  If not, see <http://www.gnu.org/licenses/>.
*/


IronbaneApp.factory('LootableMesh', ['Mesh', function(Mesh){
var LootableMesh = Mesh.extend({
  Init: function(position, rotation, id, param, metadata) {

//    this.lootableType = param;
//
//    // Mesh ID of the sign to use
//    switch(param) {
//      case LootBagTypeEnum.CHEST:
//        param = 13;
//        break;
//      case LootBagTypeEnum.BOOKSHELVES:
//        param = 10;
//        break;
//    }

    this._super(position, rotation, id, param, metadata);

  },
  BuildMesh: function(geometry, jsonMaterials) {

    this._super(geometry, jsonMaterials);

    this.object3D.rotation.copy(this.rotation.clone());

    // this.UpdateRotation();

	},
  tick: function(dTime) {
    this._super(dTime);
  }
});
return LootableMesh;
}]);