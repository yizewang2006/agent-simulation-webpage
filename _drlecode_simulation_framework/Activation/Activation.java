package Activation;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Action.NeighborReference;
import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Activation_getCheckingValue.Activation_CheckingValue;
import Activation_getCheckingValue.NeighborChecking_Value;
import Activation_getCheckingValue.SelfChecking_Value;
import Activation_getCheckingValue.SpaceChecking_Value;
import Goal.Goal;
import Utility.GlobalVariable;
import Utility.ReturnSenseObstacle;
import Utility.myUtility;
import activation_function.Activation_function;
import activation_function.Activation_function_binary;
import activation_function.Activation_function_linear;
import agents.Agent;
import agents.Property_numeric;
import behavior.Behavior;
import behavior.BehaviorTemplate;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import zones.Zone;

public class Activation 
{
	public GlobalVariable global_var = new GlobalVariable();
	
	public Activation_function activation_function = new Activation_function();
	
	public Activation_criteria criteria = new Activation_criteria();
	
	public Activation_CheckingValue checking_value_reference = new Activation_CheckingValue();
	
	public myUtility myUtility = new myUtility();
	
	public double extracted_p = 0;

	public int option = 0;
		
	//This is the option for random activation - need to add newProperty
	public Activation(BehaviorTemplate b_temp)
	{	
		Random rand;
		rand = new Random();  
		
				
		//Get the activation function option first
		//Option 0, 1, 2, 3
		this.option = Main.searchSpace.activation_option.get(rand.nextInt(Main.searchSpace.activation_option.size()));
		
		//Option 0: Always activate
		if (option == 0)
		{
			this.option = 0;
			this.extracted_p = 0;
			this.activation_function = new Activation_function();
			this.criteria = new DefaultCriteria();
		}
		//Option 1: Self property checking
		else if (option == 1)
		{
			this.option = 1;
			
			this.extracted_p = Main.searchSpace.activation_self_check_properties.get(rand.nextInt(Main.searchSpace.activation_self_check_properties.size()));
			//createRandomRange(this.extracted_p);
			
			Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_p, Main.searchSpace.filter_template);
			
			if (Main.searchSpace.numerical_property.contains(this.extracted_p))
			{
				this.criteria = new RangeCriteria(chosen_filter_range.lowerRange, chosen_filter_range.upperRange);

			}
			else
			{
				this.criteria = new CategoryCriteria(chosen_filter_range.filtered_set);

			}
			
			if (this.criteria instanceof RangeCriteria || this.criteria instanceof CategoryCriteria )
			{
				
			}
			else
			{
				System.out.println("Check");
			}
			
			this.checking_value_reference = new SelfChecking_Value(this.extracted_p);
		}
		//Option 2: Neighbor property checking
		else if (option == 2)
		{
			this.option = 2;
			
			this.extracted_p = Main.searchSpace.activation_neighbor_check_properties.get(rand.nextInt(Main.searchSpace.activation_neighbor_check_properties.size()));
			
			Filter_ranged chosen_filter_range = null;
			
			chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_p,Main.searchSpace.filter_template);

			if (Main.searchSpace.numerical_property.contains(this.extracted_p))
			{
				this.criteria = new RangeCriteria(chosen_filter_range.lowerRange, chosen_filter_range.upperRange);
			}
			else
			{
				this.criteria = new CategoryCriteria(chosen_filter_range.filtered_set);
			}
			
			//Option for null activation option
			int random_null_activate_option = rand.nextInt(2);
			
			boolean null_a;
			
			if (random_null_activate_option == 0)
			{
				null_a = false;
			}
			else
			{
				null_a = true;
			}
			
			Filter f = new Filter();
			
			this.checking_value_reference = new NeighborChecking_Value(this.extracted_p, f.setRandomFilterChain(new NeighborReference()), null_a);
			
			NeighborChecking_Value n_c_v =  (NeighborChecking_Value) this.checking_value_reference;
			
			//Does not make sense for agent to check zone in of a zone
			if (this.extracted_p == 5.0)
			{
				for (Filter f1: n_c_v.filter_chain)
				{
					if (f1 instanceof Filter_ranged)
					{
						Filter_ranged fr = (Filter_ranged) f1;
						
						for (Double d : fr.filtered_set)
						{
							if (d != 1.0 || d!= 2.0)
							{
								fr.remove = true;
							}
								
						}
					}
				}
			}
			
			n_c_v.filter_chain.removeIf(n -> n.remove == true);
			
		}
		else if (option == 3)
		{
			this.option = 3;
			
			
			//Option for null activation option
			int random_null_activate_option = rand.nextInt(2);
			
			boolean null_a;
			
			if (random_null_activate_option == 0)
			{
				null_a = false;
			}
			else
			{
				null_a = true;
			}
			
			//SpaceReference_Expand space_action = new SpaceReference_Expand(2);
			
			SpaceReference_Static space_action = new SpaceReference_Static(2);
			
			this.checking_value_reference = new SpaceChecking_Value(2,space_action,null_a);
			
			this.extracted_p = space_action.act_on_space_property;
			
			Filter_ranged chosen_filter_range = null;
			
			
			chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(this.extracted_p, Main.searchSpace.filter_template_forSpace_behavior);
			
			this.criteria = new RangeCriteria(chosen_filter_range.lowerRange, chosen_filter_range.upperRange);
			
			
		}
		
		//Add a random activation function here 
		if(this.option == 0)
		{
			//Default activation function
			//Always active 
			activation_function = new Activation_function();
		}
		else
		{
			int activation_function_option = Main.searchSpace.activation_function_option.get(rand.nextInt(Main.searchSpace.activation_function_option.size()));
			
			if (activation_function_option == 1)
			{
				activation_function = new Activation_function_binary();
			}
			else if (activation_function_option == 2)
			{
				if (Main.searchSpace.numerical_property.contains(this.extracted_p))
				{
					activation_function = new Activation_function_linear();
				}
				//Since category property cannot apply linear function 
				//-> switch to binary.
				else
				{
					activation_function_option = 1;
					activation_function = new Activation_function_binary();
				}	
				
			}
			
		}
	}
	
	//Option for activation
	//option = 0: always activate the behavior group
	
	public Activation()
	{
		this.option = 0;
		this.extracted_p = 0;
		this.activation_function = new Activation_function();
		this.criteria = new DefaultCriteria();
	}
	 
	
	
	//Option for activation
	//option = 0: always activate the behavior group
	public Activation(Activation_function act_func)
	{
		this.option = 0;
		this.extracted_p = 0;
		this.activation_function = act_func;
		this.criteria = new DefaultCriteria();
	}
	

	//option = 1: check self condition
	//COnstuctor for numeric property
	public Activation (double extracted_property, double lRange, double uRange, Activation_function act_func)
	{
		this.extracted_p = extracted_property;
		
		/*
		this.activation_lowerRange = lRange;
		
		this.activation_upperRange = uRange;
		*/
		
		this.criteria = new RangeCriteria(lRange, uRange);
		
		this.option = 1;
		
		this.checking_value_reference  = new SelfChecking_Value(extracted_property);
		
		this.activation_function = act_func;
	}
	
	//option = 1: for category property
	//Constructor for category property
	public Activation (double extracted_property, ArrayList<Double> c_set, Activation_function act_func)
	{
		this.extracted_p = extracted_property;
			
		/*
		for (Double c: c_set)
		{
			check_set.add(c);
		}
		*/
		
		this.criteria = new CategoryCriteria(c_set);
		
		this.option = 1;
		
		this.checking_value_reference  = new SelfChecking_Value(extracted_property);
		
		this.activation_function = act_func;
	}
	
	//option = 2: check other agent condition
	//Constructor for numeric property
	public Activation (ArrayList<Filter> filter_chain, double extracted_property, double lRange, double uRange, boolean null_activate, Activation_function act_func)
	{

		this.extracted_p = extracted_property;
		
		/*
		this.activation_lowerRange = lRange;
		
		this.activation_upperRange = uRange;
		*/
		
		this.criteria = new RangeCriteria(lRange, uRange);
		
		this.checking_value_reference  = new NeighborChecking_Value(extracted_property, filter_chain, null_activate);
		
		this.option = 2;
		
		this.activation_function = act_func;
	}
	
	//option = 2: check other agent condition
	//Constructor for category property
	public Activation (ArrayList<Filter> filter_chain, double extracted_property, ArrayList<Double> c_set, boolean null_activate, Activation_function act_func)
	{

		this.extracted_p = extracted_property;

		/*
		for (Double c: c_set)
		{
			check_set.add(c);
		}
		*/
		
		this.criteria = new CategoryCriteria(c_set);
		
		this.checking_value_reference  = new NeighborChecking_Value(extracted_property, filter_chain, null_activate);
		
		this.option = 2;

		this.activation_function = act_func;
	}
	
	//option = 3 : check space expand property condition
	public Activation (double extracted_property, SpaceReference_Expand space_action_activation, double lRange, double uRange, boolean null_activate, Activation_function act_func)
	{

		this.extracted_p = extracted_property;

		/*
		for (Double c: c_set)
		{
			check_set.add(c);
		}
		*/
		
		this.criteria = new RangeCriteria(lRange, uRange);
		
		this.checking_value_reference  = new SpaceChecking_Value(2, space_action_activation, null_activate);
		
		this.option = 3;

		this.activation_function = act_func;
	}
	
	//option = 3 : check space static property condition
	public Activation (double extracted_property, SpaceReference_Static space_action_activation, double lRange, double uRange, boolean null_activate, Activation_function act_func)
	{

		this.extracted_p = extracted_property;

		/*
			for (Double c: c_set)
			{
				check_set.add(c);
			}
		 */

		this.criteria = new RangeCriteria(lRange, uRange);

		this.checking_value_reference  = new SpaceChecking_Value(2, space_action_activation, null_activate);

		this.option = 3;

		this.activation_function = act_func;
	}

	public double return_weight_SelfCheck(Agent target_agent)
	{
		double weight = 0;
			
		//double checking_value = getSelfCheckingValue(target_agent, this.extracted_p);
		
		double checking_value = Double.NaN;
		
		if (this.checking_value_reference instanceof SelfChecking_Value)
		{
			SelfChecking_Value s_c_r = (SelfChecking_Value) this.checking_value_reference;
			checking_value = s_c_r.getSelfCheckingValue(target_agent, this.extracted_p);
		}
		else
		{
			System.out.println("Activation checking value reference is not SelfChecking. Activation.java");
		}
			
		if (checking_value == Double.NaN)
		{
			System.out.println("Cannot get a value to check for weight. Activation.java");
		}
		
		weight = getWeight(checking_value);
		
		return weight;
	}
	
	public double return_weight_NeighborCheck(Agent target_agent,ArrayList<Entity> neighbor, int timestep)
	{
		double weight = 0;
		
		double checking_value = Double.NaN;
		
		if (this.checking_value_reference instanceof NeighborChecking_Value)
		{
			NeighborChecking_Value n_c_r = (NeighborChecking_Value) this.checking_value_reference;
			checking_value = n_c_r.getNeighborCheckingValue(target_agent, neighbor, 0);
			
			// checking value is NaN means target_agent cannot get reference from any neighbor entity
			//Meaning for various reason such as: filters removes all entity, the entity does not have checking value
			if (Double.isNaN(checking_value))
			{
				
				if (n_c_r.null_activation == true)
				{
					return this.activation_function.weight;
				}
				else
				{
					return 0;
				}
			}
		}
		else
		{
			System.out.println("Activation checking value reference is not NeighborChecking. Activation.java");
		}
		
		
		weight = getWeight(checking_value);
		
		return weight;
	}
	
	public double return_weight_SpaceCheck(Agent target_agent, ArrayList<Entity> neighbor, ArrayList<Obstacle> obstacles, ArrayList<Goal> goals, int timestep)
	{
		double weight = 0;
		
		double checking_value = Double.NaN;
		
		if (this.checking_value_reference instanceof SpaceChecking_Value)
		{
			SpaceChecking_Value s_c_v = (SpaceChecking_Value) this.checking_value_reference;
			checking_value = s_c_v.getSpaceCheckingValue(target_agent, neighbor, obstacles, goals, timestep);
			
			// checking value is NaN means target_agent cannot get reference from any neighbor entity
			//Meaning for various reason such as: filters removes all entity, the entity does not have checking value
			if (checking_value == Double.NaN)
			{

				if (s_c_v.null_activation == true)
				{
					return this.activation_function.weight;
				}
				else
				{
					return 0;
				}
			}
		}
		else
		{
			System.out.println("Activation checking value reference is not SpaceChecking. Activation.java");
		}
		
		weight = getWeight(checking_value);
		
		return weight;
	}
	
	public double getWeight(double checking_value)
	{
		if (this.activation_function.type == 0)
		{
			return this.activation_function.weight;
		}
		//Binary function
		else if (this.activation_function instanceof Activation_function_binary)
		//else if (this.activation_function.type == 1)
		{
			
			Activation_function_binary afb = (Activation_function_binary) activation_function;
			
			if (this.criteria instanceof RangeCriteria)
			{
				RangeCriteria rc = (RangeCriteria) this.criteria;
				return afb.binaryFunction_weight_numbericProperty(checking_value, rc.activation_lowerRange, rc.activation_upperRange);
			}
			else if (this.criteria instanceof CategoryCriteria)
			{
				CategoryCriteria cc = (CategoryCriteria) criteria;
                return afb.binaryFunction_weight_categoryProperty(checking_value, cc.check_set);
			}
		
		}
		//Linear function
		else if (this.activation_function instanceof Activation_function_linear)
		//else if (this.activation_function.type == 2)
		{
			Activation_function_linear afl = (Activation_function_linear) activation_function;
			
			if (this.criteria instanceof RangeCriteria)
			{
				RangeCriteria rc = (RangeCriteria) this.criteria;
				return afl.linearFunction_weight_numbericProperty(checking_value, rc.activation_lowerRange, rc.activation_upperRange);
			}
			else if (this.criteria instanceof CategoryCriteria)
			{
				System.out.println("linear activation function does not apply for category property - Activation.java - return_weight_SelfCheck");
				return 0;
			}
			
		}
		
		return 0;
	}
	
	public void mutateCriteria(double extracted_pro, Activation_CheckingValue activation_checking_value)
	{
		
		Random rand;
		rand = new Random(); 
		
		//Property with range criteria
		if (this.criteria instanceof RangeCriteria)
		{
			RangeCriteria rc = (RangeCriteria) this.criteria;
			
			if (extracted_pro == 2.2)	
				System.out.println(extracted_pro);
			
			Filter_ranged chosen_filter_range;
			
			if (activation_checking_value instanceof SpaceChecking_Value)
			{
				chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_pro, Main.searchSpace.filter_template_forSpace_behavior);
			}
			else
			{
				chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_pro, Main.searchSpace.filter_template);
			}
			
			
			rc.activation_lowerRange = chosen_filter_range.lowerRange;
			
			rc.activation_upperRange = chosen_filter_range.upperRange;
			
		}
		//Property with category property
		else
		{
			CategoryCriteria cc = (CategoryCriteria) this.criteria;
			
			cc.check_set.clear();
			
			Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_pro, Main.searchSpace.filter_template);
			
			
			for (Double d : chosen_filter_range.filtered_set)
			{
				cc.check_set.add(d);
			}
		}
	}
	
	public void mutateActivationFunction()
	{
		Random rand;
		rand = new Random();  
	
		//Binary activation function
		if (this.activation_function instanceof Activation_function_binary)
		{
			Activation_function_binary afb = (Activation_function_binary) this.activation_function;
			
			//Mutate inside parameters
			if (afb.inside == false)
			{
				afb.inside = true;
			}
			else
			{
				afb.inside = false;
			}
		}
		//Linear activation function
		else if (this.activation_function instanceof Activation_function_linear)
		{
			Activation_function_linear afl = (Activation_function_linear) this.activation_function;
			
			//0: mutate increase
			//1: mutate slope
			int random_option = rand.nextInt(2);
			
			//0: mutate increase
			if (random_option == 0)
			{
				if (afl.increase == false)
				{
					afl.increase = true;
				}
				else
				{
					afl.increase = false;
				}
			}
			//1: mutate slope
			else if (random_option == 1)
			{
				//afl.slope = ThreadLocalRandom.current().nextDouble(0 , global_var.max_slope);
				afl.slope = Main.searchSpace.linear_activation_function_slope.get(rand.nextInt(Main.searchSpace.linear_activation_function_slope.size()));

			}
		}
	}
	
	public void mutateNullActivation()
	{
		if (this.checking_value_reference instanceof NeighborChecking_Value)
		{
			NeighborChecking_Value n_c_v = (NeighborChecking_Value) this.checking_value_reference;
			
			if (n_c_v.null_activation == false)
			{
				n_c_v.null_activation = true;
			}
			else
			{
				n_c_v.null_activation = false;
			}
		}
		else
		{
			System.out.println("Does not have null actiavtion component. Activation.java");
		}
		
	}
	
}
