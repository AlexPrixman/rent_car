<?php
defined('BASEPATH') OR exit('no direct script access allowed');

class Admin extends CI_Controller{
    function __construct(){
        parent::__construct();
        $this->load->model('m_rental');
        $this->load->helper('url', 'form');
        $this->load->library('form_validation');
    }

    //This is the function for the admin dashboard display
    function index(){
        $data['customer'] = $this->db->query("select * from customer order by customer_id desc limit 3")->result(); //featuring new customers
        $data['car'] = $this->db->query("select * from car order by car_id desc limit 3")->result(); //featuring a new car
        $data['car_category'] = $this->db->query("select * from car_category order by cat_id desc limit 3")->result(); //featuring a new car
        $this->load->view('admin/header');
        $this->load->view('admin/index',$data);
        $this->load->view('admin/footer');
    }

    //Car CRUD function
    function car(){
        $data['car'] = $this->m_rental->get_data('car')->result(); //This is the read_function on the controller.
        $this->load->view('admin/header');
        $this->load->view('admin/car',$data);
        $this->load->view('admin/footer');
    }
    function add_car(){
        $this->load->view('admin/header');
        $this->load->view('admin/add_car');
        $this->load->view('admin/footer');
    }
    //Over here we admin the cars
    function add_car_act(){
        $car_id         = $this->input->post('car_id');
        $car_desc       = $this->input->post('car_desc');
        $car_chasis     = $this->input->post('car_chasis');
        $car_engine     = $this->input->post('car_engine');
        $car_plate      = $this->input->post('car_plate');
        $brand_desc     = $this->input->post('brand_desc');
        $cat_desc       = $this->input->post('cat_desc');
        $fuel_desc      = $this->input->post('fuel_desc');
        $car_status     = $this->input->post('car_status');
        $model_desc     = $this->input->post('model_desc');
        $this->form_validation->set_rules('car_id','Car brand','required');
        $this->form_validation->set_rules('car_status','Car status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'car_id'        => $car_id,
                'car_desc'      => $car_desc,
                'car_chasis'    => $car_chasis,
                'car_engine'    => $car_engine,
                'car_plate'     => $car_plate,
                'cat_desc'      => $cat_desc,
                'brand_desc'    => $brand_desc,
                'fuel_desc'     => $fuel_desc,
                'car_status'    => $car_status,
                'model_desc'    => $model_desc
            );
            $this->m_rental->insert_data($data, 'car');
            redirect(base_url().'index.php/admin/car');
        } else { 
            $this->load->view('admin/header');
            $this->load->view('admin/add_car');
            $this->load->view('admin/footer');
        } 
    }

    function edit_car($car_id){
        $where = array('car_id' => $car_id);
        $data['car'] = $this->m_rental->edit_data($where,'car')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/edit_car',$data);
        $this->load->view('admin/footer');
    }

    function update_car(){
        $car_id         = $this->input->post('car_id');
        $car_desc       = $this->input->post('car_desc');
        $car_chasis     = $this->input->post('car_chasis');
        $car_engine     = $this->input->post('car_engine');
        $car_plate      = $this->input->post('car_plate');
        $brand_desc     = $this->input->post('brand_desc');
        $model_desc     = $this->input->post('model_desc');
        $cat_desc       = $this->input->post('cat_desc');
        $fuel_desc      = $this->input->post('fuel_desc');
        $car_status     = $this->input->post('car_status');
        $this->form_validation->set_rules('car_id','Car brand','required');
        $this->form_validation->set_rules('car_status','Car status','required');
        
        if($this->form_validation->run() != false){
            $where = array('car_id' => $car_id);
            $data = array(
                'car_id'        => $car_id,
                'car_desc'      => $car_desc,
                'car_chasis'    => $car_chasis,
                'car_engine'    => $car_engine,
                'car_plate'     => $car_plate,
                'brand_desc'    => $brand_desc,
                'model_desc'    => $model_desc,
                'cat_desc'      => $cat_desc,
                'fuel_desc'     => $fuel_desc,
                'car_status'    => $car_status
            );
            
            $this->m_rental->update_data($where, $data, 'car');
            redirect(base_url().'index.php/admin/car');
        } else {
            $where = array('car_id' => $car_id);
            $data['car'] = $this->m_rental->edit_data($where,'car')->result();
            $this->load->view('admin/header');
            $this->load->view('admin/edit_car',$data);
            $this->load->view('admin/footer');
        }
    }
    function delete_car($car_id){
        $where = array('car_id' => $car_id);
        $this->m_rental->delete_data($where, 'car');
        redirect(base_url().'index.php/admin/car');
    }

    //This is the Customer CRUD function
    function customer(){
        $data['customer'] = $this->m_rental->get_data('customer')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/customer',$data);
        $this->load->view('admin/footer');
    }
    function add_customer(){
        $this->load->view('admin/header');
        $this->load->view('admin/add_customer');
        $this->load->view('admin/footer');
    }
    function add_customer_act(){
        $customer_id                = $this->input->post('customer_id');
        $customer_name              = $this->input->post('customer_name');
        $customer_cedula            = $this->input->post('customer_cedula');
        $customer_cc                = $this->input->post('customer_cc');
        $customer_credit_limit      = $this->input->post('customer_credit_limit');
        $customer_type              = $this->input->post('customer_type');
        $customer_status            = $this->input->post('customer_status');
        $this->form_validation->set_rules('customer_name','Name','required');
        $this->form_validation->set_rules('customer_cedula','Cedula','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'customer_id'               => $customer_id,
                'customer_name'             => $customer_name,
                'customer_cedula'           => $customer_cedula,
                'customer_cc'               => $customer_cc,
                'customer_credit_limit'     => $customer_credit_limit,
                'customer_type'             => $customer_type,
                'customer_status'           => $customer_status
            );
            
            $this->m_rental->insert_data($data, 'customer');
            redirect(base_url().'index.php/admin/customer');
        } else {
            $this->load->view('admin/header');
            $this->load->view('admin/add_customer');
            $this->load->view('admin/footer');
        }
    }
    function edit_customer($customer_id){
        $where = array('customer_id' => $customer_id);
        $data['customer'] = $this->m_rental->edit_data($where,'customer')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/edit_customer',$data);
        $this->load->view('admin/footer');
    }
    function update_customer(){
        $customer_id                = $this->input->post('customer_id');
        $customer_name              = $this->input->post('customer_name');
        $customer_cedula            = $this->input->post('customer_cedula');
        $customer_cc                = $this->input->post('customer_cc');
        $customer_credit_limit      = $this->input->post('customer_credit_limit');
        $customer_type              = $this->input->post('customer_type');
        $customer_status            = $this->input->post('customer_status');
        $this->form_validation->set_rules('customer_name','Name','required');
        $this->form_validation->set_rules('customer_cedula','Cedula','required');
        
        if($this->form_validation->run() != false){
            $where = array('customer_id' => $customer_id);
            $data = array(
                'customer_id'               => $customer_id,
                'customer_name'             => $customer_name,
                'customer_cedula'           => $customer_cedula,
                'customer_cc'               => $customer_cc,
                'customer_credit_limit'     => $customer_credit_limit,
                'customer_type'             => $customer_type,
                'customer_status'           => $customer_status
            );
            
            $this->m_rental->update_data($where, $data, 'customer');
            redirect(base_url().'index.php/admin/customer');
        } else {
            $where = array('customer_id' => $customer_id);
            $data['customer'] = $this->m_rental->edit_data($where,'customer')->result();
            $this->load->view('admin/header');
            $this->load->view('admin/edit_customer',$data);
            $this->load->view('admin/footer');
        }
    }    
    function delete_customer($customer_id){
        $where = array('customer_id' => $customer_id);
        $this->m_rental->delete_data($where, 'customer');
        redirect(base_url().'index.php/admin/customer');
    }

    //Here we are going to administer the employees information
    function employee(){
        $data['employee'] = $this->m_rental->get_data('employee')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/employee',$data);
        $this->load->view('admin/footer');
    }

    function add_employee(){
        $this->load->view('admin/header');
        $this->load->view('admin/add_employee');
        $this->load->view('admin/footer');
    }
    
    function add_employee_act(){
        $employee_id            = $this->input->post('employee_id');
        $employee_name          = $this->input->post('employee_name');
        $employee_cedula        = $this->input->post('employee_cedula');
        $employee_schedule      = $this->input->post('employee_schedule');
        $employee_commission    = $this->input->post('employee_commission');
        $employee_hiring_date   = $this->input->post('employee_hiring_date');
        $employee_status        = $this->input->post('employee_status');
        $this->form_validation->set_rules('employee_name','Name','required');
        $this->form_validation->set_rules('employee_cedula','Cedula','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'employee_id'           => $employee_id,
                'employee_name'         => $employee_name,
                'employee_cedula'       => $employee_cedula,
                'employee_schedule'     => $employee_schedule,
                'employee_commission'   => $employee_commission,
                'employee_hiring_date'  => $employee_hiring_date,
                'employee_status'       => $employee_status
            );
            
            $this->m_rental->insert_data($data, 'employee');
            redirect(base_url().'index.php/admin/employee');
        } else {
            $this->load->view('admin/header');
            $this->load->view('admin/add_employee');
            $this->load->view('admin/footer');
        }
    }

    function edit_employee($employee_id){
        $where = array('employee_id' => $employee_id);
        $data['employee'] = $this->m_rental->edit_data($where,'employee')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/edit_employee',$data);
        $this->load->view('admin/footer');
    }

    function update_employee(){
        $employee_id            = $this->input->post('employee_id');
        $employee_name          = $this->input->post('employee_name');
        $employee_cedula        = $this->input->post('employee_cedula');
        $employee_schedule      = $this->input->post('employee_schedule');
        $employee_commission    = $this->input->post('employee_commission');
        $employee_hiring_date   = $this->input->post('employee_hiring_date');
        $employee_status        = $this->input->post('employee_status');
        $this->form_validation->set_rules('employee_name','Name','required');
        $this->form_validation->set_rules('employee_cedula','Cedula','required');
        
        if($this->form_validation->run() != false){
            $where = array('employee_id' => $employee_id);
            $data = array(
                'employee_id'           => $employee_id,
                'employee_name'         => $employee_name,
                'employee_cedula'       => $employee_cedula,
                'employee_schedule'     => $employee_schedule,
                'employee_commission'   => $employee_commission,
                'employee_hiring_date'  => $employee_hiring_date,
                'employee_status'       => $employee_status
            );
            
            $this->m_rental->update_data($where, $data, 'employee');
            redirect(base_url().'index.php/admin/employee');
        } else {
            $where = array('employee_id' => $employee_id);
            $data['employee'] = $this->m_rental->edit_data($where,'employee')->result();
            $this->load->view('admin/header');
            $this->load->view('admin/edit_employee',$data);
            $this->load->view('admin/footer');
        }
    }

    function delete_employee($employee_id){
        $where = array('employee_id' => $employee_id);
        $this->m_rental->delete_data($where, 'employee');
        redirect(base_url().'index.php/admin/employee');
    } 

    function category(){
        $data['car_category'] = $this->m_rental->get_data('car_category')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/category',$data);
        $this->load->view('admin/footer');
    } 

    function add_category_act(){
        $cat_id            = $this->input->post('cat_id');
        $cat_desc          = $this->input->post('cat_desc');
        $cat_status        = $this->input->post('cat_status');
        $this->form_validation->set_rules('cat_desc','Category','required');
        $this->form_validation->set_rules('cat_status','Status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'cat_id'           => $cat_id,
                'cat_desc'         => $cat_desc,
                'cat_status'       => $cat_status
            );
            
            $this->m_rental->insert_data($data, 'car_category');
            redirect(base_url().'index.php/admin/category');
        } else {
            $this->load->view('admin/header');
            $this->load->view('admin/add_category');
            $this->load->view('admin/footer');
        }
    }

    function edit_category($cat_id){
        $where = array('cat_id' => $cat_id);
        $data['car_category'] = $this->m_rental->edit_data($where,'car_category')->result();
        $this->load->view('admin/header');
        $this->load->view('admin/edit_category',$data);
        $this->load->view('admin/footer');
    }

    function update_category(){
        $cat_id            = $this->input->post('cat_id');
        $cat_desc          = $this->input->post('cat_desc');
        $cat_status        = $this->input->post('cat_status');
        $this->form_validation->set_rules('cat_desc','Category','required');
        $this->form_validation->set_rules('cat_status','Status','required');
        
        if($this->form_validation->run() != false){
            $where = array('cat_id' => $cat_id);
            $data = array(
                'cat_id'           => $cat_id,
                'cat_desc'         => $cat_desc,
                'cat_status'       => $cat_status
            );
            
            $this->m_rental->update_data($where, $data, 'car_category');
            redirect(base_url().'index.php/admin/category');
        } else {
            $where = array('cat_id' => $cat_id);
            $data['car_category'] = $this->m_rental->edit_data($where,'car_category')->result();
            $this->load->view('admin/header');
            $this->load->view('admin/edit_category',$data);
            $this->load->view('admin/footer');
        }
    }
    
    function delete_category($cat_id){
        $where = array('cat_id' => $cat_id);
        $this->m_rental->delete_data($where, 'car_category');
        redirect(base_url().'index.php/admin/category');
    } 

}    

?>    