<?php
defined('BASEPATH') OR exit('no direct script access allowed');

class Home extends CI_Controller{
    function __construct(){
        parent::__construct();
    }

    //This is the function for the admin dashboard display
    function index(){
        $this->load->view('admin/login');
    }

    //Car CRUD function
    function car(){
        $data['car'] = $this->m_rental->get_data('car')->result(); //This is the read_function on the controller.
        $this->load->view('header');
        $this->load->view('admin/car',$data);
        $this->load->view('footer');
    }

    //Over here we admin the cars
    function add_car_act(){
        $data = array(
            'car' => $this->m_rental->get_data('car')->result(),
            'categories' => $this->m_rental->get_data('car_category')->result(),
            'brand' => $this->m_rental->get_data('car_brand')->result(),
            'model' => $this->m_rental->get_data('car_model')->result()
        );
  
        $car_id         = $this->input->post('car_id');
        $car_desc       = $this->input->post('car_desc');
        $car_chasis     = $this->input->post('car_chasis');
        $car_engine     = $this->input->post('car_engine');
        $cat_desc       = $this->input->post('cat_desc');
        $brand_desc     = $this->input->post('brand_desc');
        $model_desc     = $this->input->post('model_desc');
        $car_plate      = $this->input->post('car_plate');
        $fuel_desc      = $this->input->post('fuel_desc');
        $car_status     = $this->input->post('car_status');
        
        $this->form_validation->set_rules('car_desc','Car brand','required');
        $this->form_validation->set_rules('car_status','Car status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'car_id'        => $car_id,
                'car_desc'      => $car_desc,
                'car_chasis'    => $car_chasis,
                'car_engine'    => $car_engine,
                'cat_desc'      => $cat_desc,
                'brand_desc'    => $brand_desc,
                'model_desc'    => $model_desc,
                'car_plate'     => $car_plate,
                'fuel_desc'     => $fuel_desc,
                'car_status'    => $car_status                
            );
            $this->m_rental->insert_data($data, 'car');
            redirect(base_url().'home/car');
        } else { 
            $this->load->view('header');
            $this->load->view('admin/add_car', $data);
            $this->load->view('footer');
        } 
    }

    function edit_car($car_id){
        $where = array('car_id' => $car_id);
        $data['car'] = $this->m_rental->edit_data($where,'car')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_car',$data);
        $this->load->view('footer');
    }

    function update_car(){
        $car_id         = $this->input->post('car_id');
        $car_desc       = $this->input->post('car_desc');
        $car_chasis     = $this->input->post('car_chasis');
        $car_engine     = $this->input->post('car_engine');
        $cat_desc       = $this->input->post('cat_desc');
        $brand_desc     = $this->input->post('brand_desc');
        $model_desc     = $this->input->post('model_desc');
        $car_plate      = $this->input->post('car_plate');
        $fuel_desc      = $this->input->post('fuel_desc');
        $car_status     = $this->input->post('car_status');

        $this->form_validation->set_rules('car_desc','Car brand','required');
        $this->form_validation->set_rules('car_status','Car status','required');
        
        if($this->form_validation->run() != false){
            $where = array('car_id' => $car_id);
            $data = array(
                'car_id'        => $car_id,
                'car_desc'      => $car_desc,
                'car_chasis'    => $car_chasis,
                'car_engine'    => $car_engine,
                'cat_desc'      => $cat_desc,
                'brand_desc'    => $brand_desc,
                'model_desc'    => $model_desc,
                'car_plate'     => $car_plate,
                'fuel_desc'     => $fuel_desc,
                'car_status'    => $car_status    
            );
            
            $this->m_rental->update_data($where, $data, 'car');
            redirect(base_url().'home/car');
        } else {
            $where = array('car_id' => $car_id);
            $data['car'] = $this->m_rental->edit_data($where,'car')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_car',$data);
            $this->load->view('footer');
        }
    }
    function delete_car($car_id){
        $where = array('car_id' => $car_id);
        $this->m_rental->delete_data($where, 'car');
        redirect(base_url().'home/car');
    }

    //This is the Customer CRUD function
    function customer(){
        $data['customer'] = $this->m_rental->get_data('customer')->result();
        $this->load->view('header');
        $this->load->view('admin/customer',$data);
        $this->load->view('footer');
    }
    function add_customer_act(){
        $data['customer'] = $this->m_rental->get_data('customer')->result();
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
            redirect(base_url().'home/customer');
        } else {
            $this->load->view('header');
            $this->load->view('admin/add_customer', $data);
            $this->load->view('footer');
        }
    }
    function edit_customer($customer_id){
        $where = array('customer_id' => $customer_id);
        $data['customer'] = $this->m_rental->edit_data($where,'customer')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_customer',$data);
        $this->load->view('footer');
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
            redirect(base_url().'home/customer');
        } else {
            $where = array('customer_id' => $customer_id);
            $data['customer'] = $this->m_rental->edit_data($where,'customer')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_customer',$data);
            $this->load->view('footer');
        }
    }    
    function delete_customer($customer_id){
        $where = array('customer_id' => $customer_id);
        $this->m_rental->delete_data($where, 'customer');
        redirect(base_url().'home/customer');
    }

    //Here we are going to administer the employees information
    function employee(){
        $data['employee'] = $this->m_rental->get_data('employee')->result();
        $this->load->view('header');
        $this->load->view('admin/employee',$data);
        $this->load->view('footer');
    }

    function add_employee(){
        $this->load->view('header');
        $this->load->view('admin/add_employee');
        $this->load->view('footer');
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
            redirect(base_url().'home/employee');
        } else {
            $this->load->view('header');
            $this->load->view('admin/add_employee');
            $this->load->view('footer');
        }
    }

    function edit_employee($employee_id){
        $where = array('employee_id' => $employee_id);
        $data['employee'] = $this->m_rental->edit_data($where,'employee')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_employee',$data);
        $this->load->view('footer');
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
            redirect(base_url().'home/employee');
        } else {
            $where = array('employee_id' => $employee_id);
            $data['employee'] = $this->m_rental->edit_data($where,'employee')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_employee',$data);
            $this->load->view('footer');
        }
    }

    function delete_employee($employee_id){
        $where = array('employee_id' => $employee_id);
        $this->m_rental->delete_data($where, 'employee');
        redirect(base_url().'home/employee');
    } 

    function category(){
        $data['car_category'] = $this->m_rental->get_data('car_category')->result();
        $this->load->view('header');
        $this->load->view('admin/category',$data);
        $this->load->view('footer');
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
            redirect(base_url().'home/category');
        } else {
            $this->load->view('header');
            $this->load->view('admin/add_category');
            $this->load->view('footer');
        }
    }

    function edit_category($cat_id){
        $where = array('cat_id' => $cat_id);
        $data['car_category'] = $this->m_rental->edit_data($where,'car_category')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_category',$data);
        $this->load->view('footer');
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
            redirect(base_url().'home/category');
        } else {
            $where = array('cat_id' => $cat_id);
            $data['car_category'] = $this->m_rental->edit_data($where,'car_category')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_category',$data);
            $this->load->view('footer');
        }
    }
    
    function delete_category($cat_id){
        $where = array('cat_id' => $cat_id);
        $this->m_rental->delete_data($where, 'car_category');
        redirect(base_url().'home/category');
    }
    
    function brand(){
        $data['brand'] = $this->m_rental->get_data('car_brand')->result(); //This is the read_function on the controller.
        $this->load->view('header');
        $this->load->view('admin/brand',$data);
        $this->load->view('footer');
    }

    //Over here we admin the cars
    function add_brand_act(){
        $data['brand'] = $this->m_rental->get_data('car_brand')->result();
        
        $brand_id         = $this->input->post('brand_id');
        $brand_desc       = $this->input->post('brand_desc');
        $brand_status     = $this->input->post('brand_status');

        $this->form_validation->set_rules('brand_desc','Brand','required');
        $this->form_validation->set_rules('brand_status','Status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'brand_id'          => $brand_id ,
                'brand_desc'        => $brand_desc ,
                'brand_status '     => $brand_status
            );

            $this->m_rental->insert_data($data, 'car_brand');
            redirect(base_url().'home/add_car_act');
        } else { 
            $this->load->view('header');
            $this->load->view('admin/add_brand',$data);
            $this->load->view('footer');
        } 
    }
    function edit_brand($brand_id){
        $where = array('brand_id' => $brand_id);
        $data['car_brand'] = $this->m_rental->edit_data($where,'car_brand')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_brand',$data);
        $this->load->view('footer');
    }

    function update_brand(){
        $brand_id            = $this->input->post('brand_id');
        $brand_desc          = $this->input->post('brand_desc');
        $brand_status        = $this->input->post('brand_status');
        
        if($this->form_validation->run() != false){
            $where = array('brand_id' => $brand_id);
            $data = array(
                'brand_id'           => $brand_id,
                'brand_desc'         => $brand_desc,
                'brand_status'       => $brand_status
            );
            
            $this->m_rental->update_data($where, $data, 'car_brand');
            redirect(base_url().'home/brand');
        } else {
            $where = array('brand_id' => $brand_id);
            $data['car_brand'] = $this->m_rental->edit_data($where,'car_brand')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_category',$data);
            $this->load->view('footer');
        }
    }
    function delete_brand($brand_id){
        $where = array('brand_id' => $brand_id);
        $this->m_rental->delete_data($where, 'car_brand');
        redirect(base_url().'home/brand');
    }
    /**Car model Administration section */
    function model(){
        $data['model'] = $this->m_rental->get_data('car_model')->result();
        $this->load->view('header');
        $this->load->view('admin/model', $data);
        $this->load->view('footer');
    }
    function add_model_act(){
        $data['model'] = $this->m_rental->get_data('car_model')->result();

        $model_id         = $this->input->post('model_id');
        $model_desc       = $this->input->post('model_desc');
        $model_status     = $this->input->post('model_status');

        $this->form_validation->set_rules('model_desc','Model','required');
        $this->form_validation->set_rules('model_status','Status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'model_id'          => $model_id ,
                'model_desc'        => $model_desc ,
                'model_status '     => $model_status
            );
            $this->m_rental->insert_data($data, 'car_model');
            redirect(base_url('home/model'));
        } else { 
            $this->load->view('header');
            $this->load->view('admin/add_model', $data);
            $this->load->view('footer');
        } 
    }
    function edit_model($model_id){
        $where = array('model_id' => $model_id);
        $data['model'] = $this->m_rental->edit_data($where,'car_model')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_model',$data);
        $this->load->view('footer');
    }

    function update_model(){
        $model_id            = $this->input->post('model_id');
        $model_desc          = $this->input->post('model_desc');
        $model_status        = $this->input->post('model_status');
        
        if($this->form_validation->run() != false){
            $where = array('model_id' => $model_id);
            $data = array(
                'model_id'           => $model_id,
                'model_desc'         => $model_desc,
                'model_status'       => $model_status
            );
            
            $this->m_rental->update_data($where, $data, 'car_model');
            redirect(base_url().'home/model');
        } else {
            $where = array('model_id' => $model_id);
            $data['model'] = $this->m_rental->edit_data($where,'car_model')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_model',$data);
            $this->load->view('footer');
        }
    }
    
    function delete_model($model_id){
        $where = array('model_id' => $model_id);
        $this->m_rental->delete_data($where, 'car_model');
        redirect(base_url().'home/model');
    }

    function rentals(){
        $data['rental'] = $this->m_rental->get_data('rental')->result();

        $this->load->view('header');
        $this->load->view('admin/rentals',$data);
        $this->load->view('footer');
    }

    function add_rental(){
        $data = array(
            'car' => $this->m_rental->get_data('car')->result(),
            'employee' => $this->m_rental->get_data('employee')->result(),
            'customer' => $this->m_rental->get_data('customer')->result()
        );
        $car_id             = $this->input->post('car_id');
        $rental_id          = $this->input->post('rental_id');
        $employee_desc      = $this->input->post('employee_name');
        $car_desc           = $this->input->post('car_desc');
        $customer_desc      = $this->input->post('customer_name');
        $rental_date        = $this->input->post('rental_date');
        $return_date        = $this->input->post('return_date');
        $fee_per_day        = $this->input->post('fee_per_day');
        $rental_time        = $this->input->post('rental_time');
        $comment            = $this->input->post('comment');
        $rental_status      = $this->input->post('rental_status');
        
        $this->form_validation->set_rules('rental_date','Rental Date','required');
        $this->form_validation->set_rules('rental_status','Rental Status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'rental_id '        => $rental_id,
                'employee_desc'     => $employee_desc,
                'car_desc'          => $car_desc,
                'customer_desc'     => $customer_desc,
                'rental_date'       => $rental_date,
                'return_date'       => $return_date,
                'fee_per_day'       => $fee_per_day,
                'rental_time'       => $rental_time,
                'comment'           => $comment,
                'rental_status'     => $rental_status           
            );

            $this->m_rental->insert_data($data, 'rental');
            $where = array('car_id' => $car_id);
            $data2 = array(
                'car_id'        =>$car_id,
                'car_status'    => 'R'

            );
            $this->m_rental->update_data($where, $data2,'car');
            redirect(base_url().'home/rentals');
        } else { 
            $this->load->view('header');
            $this->load->view('admin/add_rental', $data);
            $this->load->view('footer');
        } 
    }
    function edit_rental($rental_id){
        $where = array('rental_id' => $rental_id);
        $data['rental'] = $this->m_rental->edit_data($where,'rental')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_rental',$data);
        $this->load->view('footer');
    }

    function update_rental(){
        $rental_id          = $this->input->post('rental_id');
        $employee_desc      = $this->input->post('employee_desc');
        $car_desc           = $this->input->post('car_desc');
        $customer_desc      = $this->input->post('customer_desc');
        $rental_date        = $this->input->post('rental_date');
        $return_date        = $this->input->post('return_date');
        $fee_per_day        = $this->input->post('fee_per_day');
        $rental_time        = $this->input->post('rental_time');
        $comment            = $this->input->post('comment');
        $rental_status      = $this->input->post('rental_status');

        $this->form_validation->set_rules('rental_date','Rental Date','required');
        $this->form_validation->set_rules('rental_status','Rental Status','required');
        
        if($this->form_validation->run() != false){
            $where = array('rental_id' => $rental_id);
            $data = array(
                'rental_id '        => $rental_id,
                'employee_desc'     => $employee_desc,
                'car_desc'          => $car_desc,
                'customer_desc'     => $customer_desc,
                'rental_date'       => $rental_date,
                'return_date'       => $return_date,
                'fee_per_day'       => $fee_per_day,
                'rental_time'       => $rental_time,
                'comment'           => $comment,
                'rental_status'     => $rental_status     
            );
            
            $this->m_rental->update_data($where, $data, 'rental');
            redirect(base_url().'home/rentals');
        } else {
            $where = array('rental_id' => $rental_id);
            $data['rental'] = $this->m_rental->edit_data($where,'rental')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_rental',$data);
            $this->load->view('footer');
        }
    }
    function delete_rental($rental_id){
        $where = array('rental_id' => $rental_id);
        $this->m_rental->delete_data($where, 'rental');
        redirect(base_url().'home/rentals');
    }


    function inspection(){
        $data['inspection'] = $this->m_rental->get_data('inspection')->result();

        $this->load->view('header');
        $this->load->view('admin/inspection',$data);
        $this->load->view('footer');
    }

    function add_inspection(){
        $data = array(
            'car' => $this->m_rental->get_data('car')->result(),
            'employee' => $this->m_rental->get_data('employee')->result(),
            'customer' => $this->m_rental->get_data('customer')->result()
        );

        $inspection_id      = $this->input->post('inspection_id');
        $car_desc           = $this->input->post('car_desc');
        $customer_desc      = $this->input->post('customer_desc');
        $is_damaged         = $this->input->post('is_damaged');
        $fuel_level         = $this->input->post('fuel_level');
        $spare_tire         = $this->input->post('spare_tire');
        $hydraulic_jack     = $this->input->post('hydraulic_jack');
        $left_front_tire    = $this->input->post('left_front_tire');
        $right_front_tire   = $this->input->post('right_front_tire');
        $left_rear_tire     = $this->input->post('left_rear_tire');
        $right_rear_tire    = $this->input->post('right_rear_tire');
        $Etc                = $this->input->post('Etc');
        $inspection_date    = $this->input->post('inspection_date');
        $employee_desc      = $this->input->post('employee_desc');
        $inspection_status  = $this->input->post('inspection_status');

        $this->form_validation->set_rules('customer_desc','Customer','required');
        $this->form_validation->set_rules('inspection_status','Inspection Status','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'inspection_id'     => $inspection_id,
                'car_desc'          => $car_desc,
                'customer_desc'     => $customer_desc,
                'is_damaged'        => $is_damaged,
                'fuel_level'        => $fuel_level,         
                'spare_tire'        => $spare_tire,
                'hydraulic_jack'    => $hydraulic_jack,
                'left_front_tire'   => $left_front_tire,
                'right_front_tire'  => $right_front_tire,
                'left_rear_tire'    => $left_rear_tire,
                'right_rear_tire'   => $right_rear_tire,
                'Etc'               => $Etc,
                'inspection_date'   => $inspection_date,
                'employee_desc'     => $employee_desc,
                'inspection_status' => $inspection_status 
            );
            $this->m_rental->insert_data($data, 'inspection');
            redirect(base_url('home/inspection'));
        } else { 
            $this->load->view('header');
            $this->load->view('admin/add_inspection', $data);
            $this->load->view('footer');
        } 
    }

    function edit_inspection($inspection_id){
        $where = array('inspection_id' => $inspection_id);
        $data['inspection'] = $this->m_rental->edit_data($where,'inspection')->result();
        $this->load->view('header');
        $this->load->view('admin/edit_inspection',$data);
        $this->load->view('footer');
    }

    function delete_inspection($inspection_id){
        $where = array('inspection_id' => $inspection_id);
        $this->m_rental->delete_data($where, 'inspection');
        redirect(base_url().'home/inspection');
    }

    function update_inspection(){
        $inspection_id      = $this->input->post('inspection_id');
        $car_desc           = $this->input->post('car_desc');
        $customer_desc      = $this->input->post('customer_desc');
        $is_damaged         = $this->input->post('is_damaged');
        $fuel_level         = $this->input->post('fuel_level');
        $spare_tire         = $this->input->post('spare_tire');
        $hydraulic_jack     = $this->input->post('hydraulic_jack');
        $left_front_tire    = $this->input->post('left_front_tire');
        $right_front_tire   = $this->input->post('right_front_tire');
        $left_rear_tire     = $this->input->post('left_rear_tire');
        $right_rear_tire    = $this->input->post('right_rear_tire');
        $etc                = $this->input->post('etc');
        $inspection_date    = $this->input->post('inspection_date');
        $employee_desc      = $this->input->post('employee_desc');
        $inspection_status  = $this->input->post('inspection_status');
        
        $this->form_validation->set_rules('customer_desc','Customer','required');
        $this->form_validation->set_rules('inspection_status','Inspection Status','required');

        if($this->form_validation->run() != false){
            $where = array('inspection_id' => $inspection_id);
            $data = array(
                'inspection_id'     => $inspection_id,
                'car_desc'          => $car_desc,
                'customer_desc'     => $customer_desc,
                'is_damaged'        => $is_damaged,
                'fuel_level'        => $fuel_level,         
                'spare_tire'        => $spare_tire,
                'hydraulic_jack'    => $hydraulic_jack,
                'left_front_tire'   => $left_front_tire,
                'right_front_tire'  => $right_front_tire,
                'left_rear_tire'    => $left_rear_tire,
                'right_rear_tire'   => $right_rear_tire,
                'etc'               => $etc,
                'inspection_date'   => $inspection_date,
                'employee_desc'     => $employee_desc,
                'inspection_status' => $inspection_status 
            );
            
            $this->m_rental->update_data($where, $data, 'inspection');
            redirect(base_url().'home/inspection');
        } else {
            $where = array('inspection_id' => $inspection_id);
            $data['inspection'] = $this->m_rental->edit_data($where,'inspection')->result();
            $this->load->view('header');
            $this->load->view('admin/edit_inspection',$data);
            $this->load->view('footer');
        }
    }

}    

?>    