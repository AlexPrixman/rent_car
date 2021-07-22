<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Agregar una Categoria</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_category_act'?>" method="post">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion de Categoria</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="cat_desc"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Catergoria</label>
                <div class="col-sm-2">
                <select class="form-control" name="cat_status">
                    <option value="A">Activo</option>
                    <option value="I">Inactivo</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/add_car_act';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>